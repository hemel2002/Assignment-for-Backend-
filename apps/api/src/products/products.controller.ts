import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { validateDto } from "../common/validation/validate";
import { ProductQueryDto, UpsertProductDto } from "./products.dto";
import { ProductsService } from "./products.service";

export function productsRouter(service: ProductsService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("product:read"),
    validateDto(ProductQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as ProductQueryDto))
    )
  );
  router.get(
    "/:id",
    requirePermissions("product:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("product:create"),
    validateDto(UpsertProductDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("product:update"),
    requireUuid("id"),
    validateDto(UpsertProductDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("product:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
