import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const permissionMap: Record<string, string[]> = {
  dashboard: ["watch"],
  permission: ["watch", "create", "read", "update", "delete"],
  role: ["watch", "create", "read", "update", "delete"],
  user: ["watch", "create", "read", "update", "delete"],
  media: ["watch", "read", "upload", "write", "delete"],
  category: ["watch", "create", "read", "update", "delete"],
  brand: ["watch", "create", "read", "update", "delete"],
  attribute: ["watch", "create", "read", "update", "delete"],
  product: ["watch", "create", "read", "update", "delete"]
};

async function seed() {
  for (const [moduleName, actions] of Object.entries(permissionMap)) {
    const group = await prisma.permissionGroup.upsert({
      where: { slug: moduleName },
      update: { name: title(moduleName) },
      create: {
        name: title(moduleName),
        slug: moduleName,
        description: `${title(moduleName)} administration`
      }
    });

    for (const action of actions) {
      await prisma.permission.upsert({
        where: { name: `${moduleName}:${action}` },
        update: { groupId: group.id, action },
        create: {
          name: `${moduleName}:${action}`,
          action,
          groupId: group.id,
          description: `${title(action)} ${moduleName}`
        }
      });
    }
  }

  const all = await prisma.permission.findMany({ select: { id: true } });
  const adminRole = await prisma.role.upsert({
    where: { name: "Super Administrator" },
    update: { active: true },
    create: {
      name: "Super Administrator",
      description: "Full platform access",
      active: true
    }
  });
  await prisma.rolePermission.createMany({
    data: all.map(({ id }) => ({ roleId: adminRole.id, permissionId: id })),
    skipDuplicates: true
  });

  const catalogNames = [
    "dashboard:watch",
    ...["media", "category", "brand", "attribute", "product"].flatMap((moduleName) =>
      permissionMap[moduleName].map((action) => `${moduleName}:${action}`)
    )
  ];
  const catalogPermissions = await prisma.permission.findMany({
    where: { name: { in: catalogNames } },
    select: { id: true }
  });
  const catalogRole = await prisma.role.upsert({
    where: { name: "Catalog Manager" },
    update: { active: true },
    create: {
      name: "Catalog Manager",
      description: "Catalog access without identity or access management",
      active: true
    }
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: catalogRole.id } });
  await prisma.rolePermission.createMany({
    data: catalogPermissions.map(({ id }) => ({
      roleId: catalogRole.id,
      permissionId: id
    }))
  });

  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@trendsbird.test" },
    update: { roleId: adminRole.id, active: true, passwordHash },
    create: {
      name: "Super Administrator",
      email: "admin@trendsbird.test",
      passwordHash,
      roleId: adminRole.id
    }
  });

  const catalogPasswordHash = await bcrypt.hash("Catalog@12345", 12);
  await prisma.user.upsert({
    where: { email: "catalog@trendsbird.test" },
    update: {
      roleId: catalogRole.id,
      active: true,
      passwordHash: catalogPasswordHash
    },
    create: {
      name: "Catalog Manager",
      email: "catalog@trendsbird.test",
      passwordHash: catalogPasswordHash,
      roleId: catalogRole.id
    }
  });

  console.log("Seed complete: admin@trendsbird.test and catalog@trendsbird.test");
}

function title(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
