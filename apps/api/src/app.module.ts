import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AccessTokenGuard } from "./common/auth/access-token.guard";
import { PermissionsGuard } from "./common/auth/permissions.guard";
import { AuditService } from "./common/audit.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { RolesModule } from "./roles/roles.module";
import { UsersModule } from "./users/users.module";
import { MediaModule } from "./media/media.module";
import { CategoriesModule } from "./categories/categories.module";
import { BrandsModule } from "./brands/brands.module";
import { AttributesModule } from "./attributes/attributes.module";
import { ProductsModule } from "./products/products.module";
import { DashboardModule } from "./dashboard/dashboard.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_ACCESS_SECRET,
        signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? "15m") as any }
      })
    }),
    PrismaModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    MediaModule,
    CategoriesModule,
    BrandsModule,
    AttributesModule,
    ProductsModule,
    DashboardModule
  ],
  providers: [
    AuditService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard }
  ]
})
export class AppModule {}
