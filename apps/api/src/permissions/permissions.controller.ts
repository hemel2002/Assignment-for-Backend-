import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { PageQueryDto } from "../common/validation/query.dto";
import { validateDto } from "../common/validation/validate";
import {
  CreatePermissionGroupDto,
  UpdatePermissionGroupDto
} from "./permissions.dto";
import { PermissionsService } from "./permissions.service";

export function permissionsRouter(service: PermissionsService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("permission:read"),
    validateDto(PageQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as PageQueryDto))
    )
  );
  router.get(
    "/:id",
    requirePermissions("permission:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("permission:create"),
    validateDto(CreatePermissionGroupDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("permission:update"),
    requireUuid("id"),
    validateDto(UpdatePermissionGroupDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("permission:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
