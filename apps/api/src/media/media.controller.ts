import { Router } from "express";
import multer from "multer";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { UnauthorizedError } from "../common/errors/http-error";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { validateDto } from "../common/validation/validate";
import { MediaQueryDto, UpdateMediaDto } from "./media.dto";
import { MediaService } from "./media.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880) }
});

export function mediaRouter(service: MediaService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("media:read"),
    validateDto(MediaQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as MediaQueryDto))
    )
  );
  router.post(
    "/upload",
    requirePermissions("media:upload"),
    upload.array("files", 10),
    asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError("Authentication is required");
      sendSuccess(
        req,
        res,
        await service.upload(req.files as Express.Multer.File[], req.user.id),
        201
      );
    })
  );
  router.get(
    "/:id",
    requirePermissions("media:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.patch(
    "/:id",
    requirePermissions("media:write"),
    requireUuid("id"),
    validateDto(UpdateMediaDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.delete(
    "/:id",
    requirePermissions("media:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
