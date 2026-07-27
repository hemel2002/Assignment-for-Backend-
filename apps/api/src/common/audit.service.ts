import { PrismaService } from "../prisma/prisma.service";

export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(
    actorId: string | undefined,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: object
  ) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entity, entityId, metadata }
    });
  }
}
