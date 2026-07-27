import "dotenv/config";
import "reflect-metadata";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { attributesRouter } from "./attributes/attributes.controller";
import { AttributesService } from "./attributes/attributes.service";
import { authRouter } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { brandsRouter } from "./brands/brands.controller";
import { BrandsService } from "./brands/brands.service";
import { categoriesRouter } from "./categories/categories.controller";
import { CategoriesService } from "./categories/categories.service";
import { authenticate } from "./common/auth/access-token.middleware";
import {
  errorHandler,
  notFoundHandler
} from "./common/errors/error.middleware";
import { dashboardRouter } from "./dashboard/dashboard.controller";
import { mediaRouter } from "./media/media.controller";
import { MediaService } from "./media/media.service";
import { permissionsRouter } from "./permissions/permissions.controller";
import { PermissionsService } from "./permissions/permissions.service";
import { PrismaService } from "./prisma/prisma.service";
import { productsRouter } from "./products/products.controller";
import { ProductsService } from "./products/products.service";
import { rolesRouter } from "./roles/roles.controller";
import { RolesService } from "./roles/roles.service";
import { usersRouter } from "./users/users.controller";
import { UsersService } from "./users/users.service";

export function createApp(prisma = new PrismaService()) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(corsMiddleware);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  const auth = new AuthService(prisma);
  app.use("/api/auth", authRouter(auth, prisma));
  app.get("/api/docs/openapi.json", (_request, response) =>
    response.json(openApiDocument())
  );
  app.get("/api/docs", (_request, response) =>
    response.type("html").send(documentationPage)
  );

  app.use("/api", authenticate(prisma));
  app.use("/api/permissions", permissionsRouter(new PermissionsService(prisma)));
  app.use("/api/roles", rolesRouter(new RolesService(prisma)));
  app.use("/api/users", usersRouter(new UsersService(prisma)));
  app.use("/api/media", mediaRouter(new MediaService(prisma)));
  app.use("/api/categories", categoriesRouter(new CategoriesService(prisma)));
  app.use("/api/brands", brandsRouter(new BrandsService(prisma)));
  app.use("/api/attributes", attributesRouter(new AttributesService(prisma)));
  app.use("/api/products", productsRouter(new ProductsService(prisma)));
  app.use("/api/dashboard", dashboardRouter(prisma));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function bootstrap() {
  const prisma = new PrismaService();
  await prisma.$connect();
  const app = createApp(prisma);
  const port = Number(process.env.PORT ?? 4000);
  const server = app.listen(port, () => {
    console.log(`Express API listening on http://localhost:${port}/api`);
  });

  const shutdown = () => {
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  void bootstrap();
}

function corsMiddleware(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction
) {
  const origin = request.headers.origin;
  const configured = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowed =
    !origin ||
    !configured.length ||
    configured.includes("*") ||
    configured.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    /^https?:\/\/localhost(?::\d+)?$/.test(origin);

  if (origin && allowed) response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
}

function openApiDocument() {
  const paths = [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/auth/session",
    "/permissions",
    "/roles",
    "/users",
    "/media",
    "/categories",
    "/brands",
    "/attributes",
    "/products",
    "/dashboard/summary"
  ];
  return {
    openapi: "3.0.3",
    info: {
      title: "Trends Bird Admin API",
      description: "Express.js e-commerce administration API",
      version: "1.0.0"
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    },
    paths: Object.fromEntries(paths.map((path) => [path, {}]))
  };
}

const documentationPage = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Trends Bird Admin API</title></head>
  <body style="font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px">
    <h1>Trends Bird Admin API</h1>
    <p>This backend now runs on Express.js with Prisma and PostgreSQL.</p>
    <p><a href="/api/docs/openapi.json">OpenAPI JSON</a></p>
    <h2>Authentication</h2>
    <code>POST /api/auth/login</code><br>
    <code>POST /api/auth/refresh</code><br>
    <code>POST /api/auth/logout</code><br>
    <code>GET /api/auth/session</code>
    <h2>Resources</h2>
    <p>Permissions, roles, users, media, categories, brands, attributes,
    products, and dashboard routes remain available under <code>/api</code>.</p>
  </body>
</html>`;
