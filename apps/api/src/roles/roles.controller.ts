import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { StatusPageQueryDto } from "../common/validation/query.dto";
import { validateDto } from "../common/validation/validate";
import { CreateRoleDto, UpdateRoleDto } from "./roles.dto";
import { RolesService } from "./roles.service";

export function rolesRouter(service: RolesService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("role:read"),
    validateDto(StatusPageQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as StatusPageQueryDto))
    )
  );
  router.get(
    "/options",
    requirePermissions("user:create"),
    asyncHandler(async (req, res) => sendSuccess(req, res, await service.options()))
  );
  router.get(
    "/:id",
    requirePermissions("role:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("role:create"),
    validateDto(CreateRoleDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("role:update"),
    requireUuid("id"),
    validateDto(UpdateRoleDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("role:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
