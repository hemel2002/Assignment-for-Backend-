import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { validateDto } from "../common/validation/validate";
import { BrandQueryDto, CreateBrandDto, UpdateBrandDto } from "./brands.dto";
import { BrandsService } from "./brands.service";

export function brandsRouter(service: BrandsService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("brand:read"),
    validateDto(BrandQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as BrandQueryDto))
    )
  );
  router.get(
    "/:id",
    requirePermissions("brand:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("brand:create"),
    validateDto(CreateBrandDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("brand:update"),
    requireUuid("id"),
    validateDto(UpdateBrandDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("brand:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
