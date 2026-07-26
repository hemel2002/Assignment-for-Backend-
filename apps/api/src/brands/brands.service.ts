import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { pageMeta } from "../common/validation/query.dto";
import { BrandQueryDto, CreateBrandDto, UpdateBrandDto } from "./brands.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: BrandQueryDto) {
    const where = {
      ...(query.search
        ? { name: { contains: query.search, mode: "insensitive" as const } }
        : {}),
      ...(query.active === undefined ? {} : { active: query.active })
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        include: {
          logo: {
            select: { id: true, publicUrl: true, thumbnailUrl: true, altText: true }
          },
          _count: { select: { products: true } }
        },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.brand.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { logo: true, _count: { select: { products: true } } }
    });
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: this.data(dto),
      include: { logo: true }
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    return this.prisma.brand.update({
      where: { id },
      data: this.data(dto),
      include: { logo: true }
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    if (brand._count.products) {
      throw new ConflictException(
        "Brand cannot be deleted while products reference it"
      );
    }
    await this.prisma.brand.delete({ where: { id } });
    return { message: "Brand deleted" };
  }

  private data(dto: CreateBrandDto) {
    return {
      name: dto.name.trim(),
      slug: slugify(dto.slug, { lower: true, strict: true }),
      logoId: dto.logoId,
      active: dto.active,
      description: dto.description
    };
  }
}
