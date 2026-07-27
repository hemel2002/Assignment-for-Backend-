import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { validateDto } from "../common/validation/validate";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";
import { CategoriesService } from "./categories.service";

export function categoriesRouter(service: CategoriesService) {
  const router = Router();

  const treeHandler = asyncHandler(async (req, res) =>
    sendSuccess(req, res, await service.tree())
  );
  router.get("/", requirePermissions("category:read"), treeHandler);
  router.get("/tree", requirePermissions("category:read"), treeHandler);
  router.get(
    "/:id",
    requirePermissions("category:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("category:create"),
    validateDto(CreateCategoryDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("category:update"),
    requireUuid("id"),
    validateDto(UpdateCategoryDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("category:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
