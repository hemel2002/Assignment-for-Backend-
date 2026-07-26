import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto
} from "./categories.dto";

export type TreeNode = {
  id: string;
  parentId: string | null;
  children?: TreeNode[];
  [key: string]: unknown;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree() {
    const categories = await this.prisma.category.findMany({
      include: {
        image: {
          select: { id: true, publicUrl: true, thumbnailUrl: true, altText: true }
        },
        _count: { select: { products: true, children: true } }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });
    const map = new Map<string, TreeNode>();
    categories.forEach((category) =>
      map.set(category.id, { ...category, children: [] })
    );
    const roots: TreeNode[] = [];
    map.forEach((node) => {
      const parent = node.parentId ? map.get(node.parentId) : undefined;
      if (parent) parent.children!.push(node);
      else roots.push(node);
    });
    return roots;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        image: true,
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true, children: true } }
      }
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) await this.ensureExists(dto.parentId);
    return this.prisma.category.create({
      data: this.data(dto),
      include: { image: true, parent: true }
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException("A category cannot be its own parent");
      }
      await this.assertNoCycle(id, dto.parentId);
    }
    return this.prisma.category.update({
      where: { id },
      data: this.data(dto),
      include: { image: true, parent: true }
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category._count.children || category._count.products) {
      throw new ConflictException(
        "Category cannot be deleted while it has children or products"
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: "Category deleted" };
  }

  private async assertNoCycle(categoryId: string, newParentId: string) {
    let cursor: string | null = newParentId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === categoryId) {
        throw new BadRequestException(
          "Parent selection would create a category cycle"
        );
      }
      if (visited.has(cursor)) {
        throw new BadRequestException("Existing category cycle detected");
      }
      visited.add(cursor);
      const parent: { parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true }
        });
      if (!parent) throw new NotFoundException("Parent category not found");
      cursor = parent.parentId;
    }
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.category.count({ where: { id } });
    if (!exists) throw new NotFoundException("Category not found");
  }

  private data(dto: CreateCategoryDto) {
    return {
      name: dto.name.trim(),
      slug: slugify(dto.slug, { lower: true, strict: true }),
      description: dto.description,
      imageId: dto.imageId,
      parentId: dto.parentId,
      active: dto.active,
      sortOrder: dto.sortOrder
    };
  }
}
