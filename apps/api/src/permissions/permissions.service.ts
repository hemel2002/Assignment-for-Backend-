import slugify from "slugify";
import { NotFoundError } from "../common/errors/http-error";
import { PrismaService } from "../prisma/prisma.service";
import { PageQueryDto, pageMeta } from "../common/validation/query.dto";
import {
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto
} from "./permissions.dto";

export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PageQueryDto) {
    const where = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            {
              permissions: {
                some: {
                  name: { contains: query.search, mode: "insensitive" as const }
                }
              }
            }
          ]
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.permissionGroup.findMany({
        where,
        include: { permissions: { orderBy: { action: "asc" } } },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.permissionGroup.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const group = await this.prisma.permissionGroup.findUnique({
      where: { id },
      include: { permissions: { orderBy: { action: "asc" } } }
    });
    if (!group) throw new NotFoundError("Permission group not found");
    return group;
  }

  create(dto: CreatePermissionGroupDto) {
    const groupSlug = slug(dto.name);
    return this.prisma.permissionGroup.create({
      data: {
        name: dto.name.trim(),
        slug: groupSlug,
        description: dto.description?.trim(),
        permissions: {
          create: unique(dto.actions).map((action) => ({
            action,
            name: `${groupSlug}:${action}`,
            description: `${action} ${dto.name.trim()}`
          }))
        }
      },
      include: { permissions: true }
    });
  }

  async update(id: string, dto: UpdatePermissionGroupDto) {
    await this.findOne(id);
    const groupSlug = slug(dto.name);
    const actions = unique(dto.actions);
    return this.prisma.$transaction(async (tx) => {
      await tx.permission.deleteMany({
        where: { groupId: id, action: { notIn: actions } }
      });
      await tx.permissionGroup.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          slug: groupSlug,
          description: dto.description?.trim()
        }
      });
      for (const action of actions) {
        await tx.permission.upsert({
          where: { groupId_action: { groupId: id, action } },
          update: { name: `${groupSlug}:${action}` },
          create: {
            groupId: id,
            action,
            name: `${groupSlug}:${action}`
          }
        });
      }
      return tx.permissionGroup.findUniqueOrThrow({
        where: { id },
        include: { permissions: true }
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.permissionGroup.delete({ where: { id } });
    return { message: "Permission group deleted; role links were cascaded" };
  }
}

const slug = (value: string) =>
  slugify(value, { lower: true, strict: true, trim: true });
const unique = (values: string[]) => [...new Set(values)];
