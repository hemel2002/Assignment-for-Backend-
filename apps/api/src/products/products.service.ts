import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, StockStatus } from "@prisma/client";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { pageMeta } from "../common/validation/query.dto";
import {
  ProductQueryDto,
  UpsertProductDto
} from "./products.dto";

const fullInclude = {
  brand: { include: { logo: true } },
  categories: { include: { category: { include: { image: true } } } },
  media: {
    include: { media: true },
    orderBy: { sortOrder: "asc" as const }
  },
  variants: {
    include: {
      values: {
        include: {
          attributeValue: { include: { attribute: true, media: true } }
        }
      },
      media: {
        include: { media: true },
        orderBy: { sortOrder: "asc" as const }
      }
    },
    orderBy: { sku: "asc" as const }
  }
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    sku: { contains: query.search, mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {}),
      ...(query.categoryId
        ? { categories: { some: { categoryId: query.categoryId } } }
        : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.active === undefined ? {} : { active: query.active })
    };
    const orderBy = {
      [query.sortBy]: query.sortOrder
    } as Prisma.ProductOrderByWithRelationInput;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          categories: {
            include: { category: { select: { id: true, name: true } } }
          },
          media: {
            where: { isThumbnail: true },
            include: { media: true },
            take: 1
          },
          variants: {
            select: { price: true, salePrice: true, stock: true, active: true }
          }
        },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.product.count({ where })
    ]);
    const items = rows.map((product) => {
      const variantPrices = product.variants
        .filter((variant) => variant.active)
        .map((variant) => Number(variant.salePrice ?? variant.price));
      return {
        ...product,
        priceRange: product.hasVariants
          ? {
              min: variantPrices.length ? Math.min(...variantPrices) : null,
              max: variantPrices.length ? Math.max(...variantPrices) : null
            }
          : {
              min: Number(product.salePrice ?? product.price),
              max: Number(product.salePrice ?? product.price)
            },
        totalStock: product.hasVariants
          ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
          : product.stock
      };
    });
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: fullInclude
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: UpsertProductDto) {
    await this.validate(dto);
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: this.productData(dto)
      });
      await this.createRelations(tx, product.id, dto);
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: fullInclude
      });
    });
  }

  async update(id: string, dto: UpsertProductDto) {
    await this.findOne(id);
    await this.validate(dto, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productCategory.deleteMany({ where: { productId: id } });
      await tx.productMedia.deleteMany({ where: { productId: id } });
      await tx.product.update({
        where: { id },
        data: this.productData(dto)
      });
      await this.createRelations(tx, id, dto);
      return tx.product.findUniqueOrThrow({
        where: { id },
        include: fullInclude
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return {
      message:
        "Product, variants, and media links deleted; media assets were preserved"
    };
  }

  private async validate(dto: UpsertProductDto, productId?: string) {
    if (dto.hasVariants) {
      if (
        dto.price !== undefined ||
        dto.salePrice !== undefined ||
        dto.stock !== undefined
      ) {
        throw new BadRequestException(
          "Variable products cannot store price, sale price, or stock on the product"
        );
      }
      if (!dto.variants.length) {
        throw new BadRequestException(
          "A variable product requires at least one variant"
        );
      }
    } else {
      if (dto.variants.length) {
        throw new BadRequestException("A simple product cannot have variants");
      }
      if (dto.price === undefined || dto.stock === undefined || !dto.sku) {
        throw new BadRequestException(
          "A simple product requires SKU, price, and stock"
        );
      }
      assertSalePrice(dto.price, dto.salePrice, "product");
    }
    if (dto.media.filter((item) => item.isThumbnail).length > 1) {
      throw new BadRequestException(
        "A product cannot have more than one thumbnail"
      );
    }
    if (new Set(dto.media.map((item) => item.mediaId)).size !== dto.media.length) {
      throw new BadRequestException("Product media contains duplicate assets");
    }

    const skuValues = [
      ...(dto.sku ? [dto.sku.trim()] : []),
      ...dto.variants.map((variant) => variant.sku.trim())
    ];
    if (new Set(skuValues).size !== skuValues.length) {
      throw new ConflictException("Product and variant SKUs must be unique");
    }
    for (const variant of dto.variants) {
      assertSalePrice(variant.price, variant.salePrice, `variant ${variant.sku}`);
      if (!variant.attributeValueIds.length) {
        throw new BadRequestException(
          `Variant ${variant.sku} requires attribute values`
        );
      }
      if (variant.media.filter((item) => item.isThumbnail).length > 1) {
        throw new BadRequestException(
          `Variant ${variant.sku} has more than one thumbnail`
        );
      }
    }
    const combinations = dto.variants.map((variant) =>
      [...variant.attributeValueIds].sort().join("|")
    );
    if (new Set(combinations).size !== combinations.length) {
      throw new ConflictException(
        "Two variants cannot use the same attribute combination"
      );
    }

    const valueIds = [
      ...new Set(dto.variants.flatMap((item) => item.attributeValueIds))
    ];
    const values = await this.prisma.attributeValue.findMany({
      where: { id: { in: valueIds } },
      select: { id: true, attributeId: true }
    });
    if (values.length !== valueIds.length) {
      throw new BadRequestException(
        "One or more variant attribute values do not exist"
      );
    }
    const valueAttribute = new Map(
      values.map((value) => [value.id, value.attributeId])
    );
    for (const variant of dto.variants) {
      const attributeIds = variant.attributeValueIds.map((id) =>
        valueAttribute.get(id)
      );
      if (new Set(attributeIds).size !== attributeIds.length) {
        throw new BadRequestException(
          `Variant ${variant.sku} selects multiple values from one attribute`
        );
      }
    }

    await this.assertReferencesExist(dto);
    await this.assertSkusAvailable(skuValues, productId);
  }

  private async assertReferencesExist(dto: UpsertProductDto) {
    const mediaIds = [
      ...new Set([
        ...dto.media.map((item) => item.mediaId),
        ...dto.variants.flatMap((variant) =>
          variant.media.map((item) => item.mediaId)
        )
      ])
    ];
    const [categoryCount, mediaCount, brandCount] = await this.prisma.$transaction([
      this.prisma.category.count({ where: { id: { in: dto.categoryIds } } }),
      this.prisma.media.count({ where: { id: { in: mediaIds } } }),
      dto.brandId
        ? this.prisma.brand.count({ where: { id: dto.brandId } })
        : this.prisma.brand.count({ where: { id: { in: [] } } })
    ]);
    if (categoryCount !== dto.categoryIds.length) {
      throw new BadRequestException("One or more categories do not exist");
    }
    if (mediaCount !== mediaIds.length) {
      throw new BadRequestException("One or more media assets do not exist");
    }
    if (dto.brandId && brandCount !== 1) {
      throw new BadRequestException("Brand does not exist");
    }
  }

  private async assertSkusAvailable(skus: string[], productId?: string) {
    const [products, variants] = await this.prisma.$transaction([
      this.prisma.product.count({
        where: {
          sku: { in: skus },
          ...(productId ? { id: { not: productId } } : {})
        }
      }),
      this.prisma.productVariant.count({
        where: {
          sku: { in: skus },
          ...(productId ? { productId: { not: productId } } : {})
        }
      })
    ]);
    if (products || variants) {
      throw new ConflictException("A product or variant SKU already exists");
    }
  }

  private productData(dto: UpsertProductDto): Prisma.ProductUncheckedCreateInput {
    const stock = dto.hasVariants ? null : dto.stock!;
    return {
      name: dto.name.trim(),
      slug: slugify(dto.slug, { lower: true, strict: true }),
      sku: dto.sku?.trim() || null,
      shortDescription: dto.shortDescription,
      longDescription: dto.longDescription
        ? sanitizeDescription(dto.longDescription)
        : null,
      hasVariants: dto.hasVariants,
      price: dto.hasVariants ? null : dto.price,
      salePrice: dto.hasVariants ? null : dto.salePrice,
      stock,
      stockStatus: stock && stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
      weight: dto.weight,
      active: dto.active,
      featured: dto.featured,
      sortOrder: dto.sortOrder,
      brandId: dto.brandId
    };
  }

  private async createRelations(
    tx: Prisma.TransactionClient,
    productId: string,
    dto: UpsertProductDto
  ) {
    if (dto.categoryIds.length) {
      await tx.productCategory.createMany({
        data: dto.categoryIds.map((categoryId) => ({ productId, categoryId }))
      });
    }
    if (dto.media.length) {
      await tx.productMedia.createMany({
        data: dto.media.map((item) => ({ productId, ...item }))
      });
    }
    for (const variant of dto.variants) {
      await tx.productVariant.create({
        data: {
          productId,
          sku: variant.sku.trim(),
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          stockStatus:
            variant.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
          lowStockThreshold: variant.lowStockThreshold,
          weight: variant.weight,
          active: variant.active,
          values: {
            create: variant.attributeValueIds.map((attributeValueId) => ({
              attributeValueId
            }))
          },
          media: {
            create: variant.media.map((item) => ({
              mediaId: item.mediaId,
              isThumbnail: item.isThumbnail,
              sortOrder: item.sortOrder
            }))
          }
        }
      });
    }
  }
}

function assertSalePrice(
  price: number,
  salePrice: number | undefined,
  label: string
) {
  if (salePrice !== undefined && salePrice > price) {
    throw new BadRequestException(
      `Sale price cannot exceed price for ${label}`
    );
  }
}

/**
 * Keep product descriptions intentionally conservative: preserve a small set of
 * formatting tags, discard all attributes (including event handlers and URLs),
 * and remove executable/embedded elements with their contents.
 */
function sanitizeDescription(value: string) {
  const allowed = new Set([
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "blockquote"
  ]);
  const withoutExecutableBlocks = value
    .replace(
      /<!--[\s\S]*?-->|<\s*(script|style|iframe|object|embed|svg)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      ""
    )
    .replace(/<\s*(script|style|iframe|object|embed|svg)\b[^>]*\/?\s*>/gi, "");
  return withoutExecutableBlocks.replace(
    /<\s*\/?\s*([a-z0-9]+)(?:\s[^>]*)?\/?\s*>/gi,
    (tag, name: string) =>
      allowed.has(name.toLowerCase())
        ? tag.trimStart().startsWith("</")
          ? `</${name.toLowerCase()}>`
          : `<${name.toLowerCase()}>`
        : ""
  );
}
