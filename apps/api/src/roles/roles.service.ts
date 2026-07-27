import { ConflictError, NotFoundError } from "../common/errors/http-error";
import { PrismaService } from "../prisma/prisma.service";
import {
  StatusPageQueryDto,
  pageMeta
} from "../common/validation/query.dto";
import { CreateRoleDto, UpdateRoleDto } from "./roles.dto";

const include = {
  permissions: {
    include: { permission: { include: { group: true } } }
  },
  _count: { select: { users: true } }
} as const;

export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: StatusPageQueryDto) {
    const where = {
      ...(query.search
        ? { name: { contains: query.search, mode: "insensitive" as const } }
        : {}),
      ...(query.active === undefined ? {} : { active: query.active })
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: { _count: { select: { users: true, permissions: true } } },
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.role.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async options() {
    return this.prisma.role.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include });
    if (!role) throw new NotFoundError("Role not found");
    return role;
  }

  async create(dto: CreateRoleDto) {
    const permissionIds = await this.resolvePermissionIds(dto);
    return this.prisma.role.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        active: dto.active,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId }))
        }
      },
      include
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    const permissionIds = await this.resolvePermissionIds(dto);
    await this.assertRoleManagerSurvives(id, permissionIds, dto.active);
    return this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.update({
        where: { id },
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
          active: dto.active,
          permissions: {
            create: permissionIds.map((permissionId) => ({ permissionId }))
          }
        }
      });
      return tx.role.findUniqueOrThrow({ where: { id }, include });
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role._count.users > 0) {
      throw new ConflictError(
        "Role cannot be deleted while users are assigned to it"
      );
    }
    await this.assertRoleManagerSurvives(id, [], false);
    await this.prisma.role.delete({ where: { id } });
    return { message: "Role deleted" };
  }

  private async resolvePermissionIds(dto: CreateRoleDto) {
    if (dto.grantAll) {
      return (
        await this.prisma.permission.findMany({ select: { id: true } })
      ).map((item) => item.id);
    }
    const count = await this.prisma.permission.count({
      where: { id: { in: dto.permissionIds } }
    });
    if (count !== dto.permissionIds.length) {
      throw new NotFoundError("One or more permissions do not exist");
    }
    return dto.permissionIds;
  }

  private async assertRoleManagerSurvives(
    changingRoleId: string,
    nextPermissionIds: string[],
    nextActive: boolean
  ) {
    const managePermission = await this.prisma.permission.findUnique({
      where: { name: "role:update" },
      select: { id: true }
    });
    if (!managePermission) return;
    const keepsPermission =
      nextActive && nextPermissionIds.includes(managePermission.id);
    if (keepsPermission) return;

    const otherManagerCount = await this.prisma.role.count({
      where: {
        id: { not: changingRoleId },
        active: true,
        permissions: { some: { permissionId: managePermission.id } }
      }
    });
    if (otherManagerCount === 0) {
      throw new ConflictError(
        "This change would leave no active role able to manage roles"
      );
    }
  }
}
