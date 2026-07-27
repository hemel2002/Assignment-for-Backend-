import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

export function dashboardRouter(prisma: PrismaService) {
  const router = Router();
  router.get(
    "/summary",
    requirePermissions("dashboard:watch"),
    asyncHandler(async (request, response) => {
      const [
        products,
        activeProducts,
        categories,
        brands,
        media,
        users,
        lowStockVariants
      ] = await prisma.$transaction([
        prisma.product.count(),
        prisma.product.count({ where: { active: true } }),
        prisma.category.count(),
        prisma.brand.count(),
        prisma.media.count(),
        prisma.user.count(),
        prisma.productVariant.count({
          where: { active: true, stock: { lte: 5 } }
        })
      ]);
      sendSuccess(request, response, {
        products,
        activeProducts,
        categories,
        brands,
        media,
        users,
        lowStockVariants
      });
    })
  );
  return router;
}
