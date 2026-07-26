import { Controller, Get } from "@nestjs/common";
import { RequirePermissions } from "../common/decorators/permissions.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("summary")
  @RequirePermissions("dashboard:watch")
  async summary() {
    const [
      products,
      activeProducts,
      categories,
      brands,
      media,
      users,
      lowStockVariants
    ] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { active: true } }),
      this.prisma.category.count(),
      this.prisma.brand.count(),
      this.prisma.media.count(),
      this.prisma.user.count(),
      this.prisma.productVariant.count({
        where: { active: true, stock: { lte: 5 } }
      })
    ]);
    return {
      products,
      activeProducts,
      categories,
      brands,
      media,
      users,
      lowStockVariants
    };
  }
}
