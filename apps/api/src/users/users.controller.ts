import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { UnauthorizedError } from "../common/errors/http-error";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { validateDto } from "../common/validation/validate";
import { CreateUserDto, UpdateUserDto, UserQueryDto } from "./users.dto";
import { UsersService } from "./users.service";

export function usersRouter(service: UsersService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("user:read"),
    validateDto(UserQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as UserQueryDto))
    )
  );
  router.get(
    "/:id",
    requirePermissions("user:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("user:create"),
    validateDto(CreateUserDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("user:update"),
    requireUuid("id"),
    validateDto(UpdateUserDto),
    asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError("Authentication is required");
      sendSuccess(
        req,
        res,
        await service.update(String(req.params.id), req.user.id, req.body)
      );
    })
  );
  router.delete(
    "/:id",
    requirePermissions("user:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError("Authentication is required");
      sendSuccess(req, res, await service.remove(String(req.params.id), req.user.id));
    })
  );
  return router;
}
