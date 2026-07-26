import {
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { PageQueryDto, pageMeta } from "../common/validation/query.dto";
import {
  AttributeValueDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto
} from "./attributes.dto";

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PageQueryDto) {
    const where = query.search
      ? { name: { contains: query.search, mode: "insensitive" as const } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.attribute.findMany({
        where,
        include: {
          values: { include: { media: true }, orderBy: { value: "asc" } }
        },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.attribute.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: {
        values: {
          include: {
            media: true,
            _count: { select: { variants: true } }
          },
          orderBy: { value: "asc" }
        }
      }
    });
    if (!attribute) throw new NotFoundException("Attribute not found");
    return attribute;
  }

  create(dto: CreateAttributeDto) {
    return this.prisma.attribute.create({
      data: {
        name: dto.name.trim(),
        slug: cleanSlug(dto.slug),
        type: dto.type,
        values: { create: dto.values.map(valueData) }
      },
      include: { values: true }
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    await this.findOne(id);
    return this.prisma.attribute.update({
      where: { id },
      data: {
        name: dto.name.trim(),
        slug: cleanSlug(dto.slug),
        type: dto.type
      },
      include: { values: true }
    });
  }

  async addValue(attributeId: string, dto: AttributeValueDto) {
    await this.findOne(attributeId);
    return this.prisma.attributeValue.create({
      data: { attributeId, ...valueData(dto) },
      include: { media: true }
    });
  }

  async updateValue(
    attributeId: string,
    valueId: string,
    dto: UpdateAttributeValueDto
  ) {
    await this.ensureValue(attributeId, valueId);
    return this.prisma.attributeValue.update({
      where: { id: valueId },
      data: valueData(dto),
      include: { media: true }
    });
  }

  async removeValue(attributeId: string, valueId: string) {
    const value = await this.ensureValue(attributeId, valueId);
    if (value._count.variants) {
      throw new ConflictException(
        "Attribute value is used by a product variant and cannot be deleted"
      );
    }
    await this.prisma.attributeValue.delete({ where: { id: valueId } });
    return { message: "Attribute value deleted" };
  }

  async remove(id: string) {
    const attribute = await this.findOne(id);
    if (attribute.values.some((value) => value._count.variants > 0)) {
      throw new ConflictException(
        "Attribute is used by product variants and cannot be deleted"
      );
    }
    await this.prisma.attribute.delete({ where: { id } });
    return { message: "Attribute and unused values deleted" };
  }

  private async ensureValue(attributeId: string, valueId: string) {
    const value = await this.prisma.attributeValue.findFirst({
      where: { id: valueId, attributeId },
      include: { _count: { select: { variants: true } } }
    });
    if (!value) throw new NotFoundException("Attribute value not found");
    return value;
  }
}

const cleanSlug = (slug: string) =>
  slugify(slug, { lower: true, strict: true });
const valueData = (dto: AttributeValueDto) => ({
  value: dto.value.trim(),
  slug: cleanSlug(dto.slug),
  reference: dto.reference,
  mediaId: dto.mediaId
});
