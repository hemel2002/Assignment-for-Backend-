-- Trends Bird Supabase seed
-- Run this AFTER migrations/20260726000000_init/migration.sql.
-- Safe to run more than once.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "PermissionGroup"
  ("id", "name", "slug", "description", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Dashboard',  'dashboard',  'Dashboard administration',  now(), now()),
  (gen_random_uuid()::text, 'Permission', 'permission', 'Permission administration', now(), now()),
  (gen_random_uuid()::text, 'Role',       'role',       'Role administration',       now(), now()),
  (gen_random_uuid()::text, 'User',       'user',       'User administration',       now(), now()),
  (gen_random_uuid()::text, 'Media',      'media',      'Media administration',      now(), now()),
  (gen_random_uuid()::text, 'Category',   'category',   'Category administration',   now(), now()),
  (gen_random_uuid()::text, 'Brand',      'brand',      'Brand administration',      now(), now()),
  (gen_random_uuid()::text, 'Attribute',  'attribute',  'Attribute administration',  now(), now()),
  (gen_random_uuid()::text, 'Product',    'product',    'Product administration',    now(), now())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = now();

WITH actions(module, action) AS (
  VALUES
    ('dashboard',  'watch'),
    ('permission', 'watch'),
    ('permission', 'create'),
    ('permission', 'read'),
    ('permission', 'update'),
    ('permission', 'delete'),
    ('role',       'watch'),
    ('role',       'create'),
    ('role',       'read'),
    ('role',       'update'),
    ('role',       'delete'),
    ('user',       'watch'),
    ('user',       'create'),
    ('user',       'read'),
    ('user',       'update'),
    ('user',       'delete'),
    ('media',      'watch'),
    ('media',      'read'),
    ('media',      'upload'),
    ('media',      'write'),
    ('media',      'delete'),
    ('category',   'watch'),
    ('category',   'create'),
    ('category',   'read'),
    ('category',   'update'),
    ('category',   'delete'),
    ('brand',      'watch'),
    ('brand',      'create'),
    ('brand',      'read'),
    ('brand',      'update'),
    ('brand',      'delete'),
    ('attribute',  'watch'),
    ('attribute',  'create'),
    ('attribute',  'read'),
    ('attribute',  'update'),
    ('attribute',  'delete'),
    ('product',    'watch'),
    ('product',    'create'),
    ('product',    'read'),
    ('product',    'update'),
    ('product',    'delete')
)
INSERT INTO "Permission"
  ("id", "name", "action", "description", "groupId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  actions.module || ':' || actions.action,
  actions.action,
  initcap(actions.action) || ' ' || actions.module,
  groups."id",
  now(),
  now()
FROM actions
JOIN "PermissionGroup" groups ON groups."slug" = actions.module
ON CONFLICT ("name") DO UPDATE SET
  "action" = EXCLUDED."action",
  "description" = EXCLUDED."description",
  "groupId" = EXCLUDED."groupId",
  "updatedAt" = now();

INSERT INTO "Role"
  ("id", "name", "description", "active", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Super Administrator', 'Full platform access', true, now(), now()),
  (gen_random_uuid()::text, 'Catalog Manager', 'Catalog access without identity or access management', true, now(), now())
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "active" = true,
  "updatedAt" = now();

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT roles."id", permissions."id"
FROM "Role" roles
CROSS JOIN "Permission" permissions
WHERE roles."name" = 'Super Administrator'
ON CONFLICT DO NOTHING;

DELETE FROM "RolePermission"
WHERE "roleId" = (
  SELECT "id" FROM "Role" WHERE "name" = 'Catalog Manager'
);

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT roles."id", permissions."id"
FROM "Role" roles
CROSS JOIN "Permission" permissions
WHERE roles."name" = 'Catalog Manager'
  AND (
    permissions."name" = 'dashboard:watch'
    OR split_part(permissions."name", ':', 1)
       IN ('media', 'category', 'brand', 'attribute', 'product')
  )
ON CONFLICT DO NOTHING;

-- Password: Admin@12345
INSERT INTO "User"
  ("id", "name", "email", "passwordHash", "roleId", "active", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Super Administrator',
  'admin@trendsbird.test',
  '$2b$12$g19FVXSsUpmqyLmyNOI.GekFTkySvcun15DJSUu24lMbT3g.jciYi',
  roles."id",
  true,
  now(),
  now()
FROM "Role" roles
WHERE roles."name" = 'Super Administrator'
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "roleId" = EXCLUDED."roleId",
  "active" = true,
  "updatedAt" = now();

-- Password: Catalog@12345
INSERT INTO "User"
  ("id", "name", "email", "passwordHash", "roleId", "active", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'Catalog Manager',
  'catalog@trendsbird.test',
  '$2b$12$FM59yvetWRawVOwiHVwxJe.J9LSfJ.pa4KFM/9uV1gFgw/OdivQ0e',
  roles."id",
  true,
  now(),
  now()
FROM "Role" roles
WHERE roles."name" = 'Catalog Manager'
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "roleId" = EXCLUDED."roleId",
  "active" = true,
  "updatedAt" = now();

-- Mark the manually executed schema migration as applied for future Prisma deploys.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations"
  ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT
  gen_random_uuid()::text,
  'ca621e1042fb20ad675fab6da8609d59ea8546f9e28a25f3323dbf3cec5cdf7d',
  now(),
  '20260726000000_init',
  now(),
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM "_prisma_migrations"
  WHERE "migration_name" = '20260726000000_init'
);

COMMIT;

SELECT
  (SELECT count(*) FROM "Permission") AS permissions,
  (SELECT count(*) FROM "Role") AS roles,
  (SELECT count(*) FROM "User") AS users;
