import * as bcrypt from "bcrypt";
import { ForbiddenError, NotFoundError } from "../common/errors/http-error";
import { PrismaService } from "../prisma/prisma.service";
import { pageMeta } from "../common/validation/query.dto";
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto
} from "./users.dto";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  gender: true,
  active: true,
  avatar: { select: { id: true, publicUrl: true, thumbnailUrl: true } },
  role: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true
} as const;

export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UserQueryDto) {
    const where = {
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                email: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {}),
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.active === undefined ? {} : { active: query.active })
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: publicSelect,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      this.prisma.user.count({ where })
    ]);
    return { items, meta: pageMeta(query.page, query.limit, total) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicSelect
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureRole(dto.roleId);
    return this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        phone: dto.phone,
        gender: dto.gender,
        avatarId: dto.avatarId,
        roleId: dto.roleId,
        active: dto.active
      },
      select: publicSelect
    });
  }

  async update(id: string, actorId: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (id === actorId && dto.roleId) {
      throw new ForbiddenError("You cannot change your own role");
    }
    if (dto.roleId) await this.ensureRole(dto.roleId);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.email ? { email: dto.email.trim().toLowerCase() } : {}),
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, 12) }
          : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.avatarId !== undefined ? { avatarId: dto.avatarId } : {}),
        ...(dto.roleId ? { roleId: dto.roleId } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {})
      },
      select: publicSelect
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenError("You cannot delete your own account");
    }
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: "User permanently deleted" };
  }

  private async ensureRole(roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, active: true },
      select: { id: true }
    });
    if (!role) throw new NotFoundError("Active role not found");
  }
}
