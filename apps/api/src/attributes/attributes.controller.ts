import { Router } from "express";
import { requirePermissions } from "../common/auth/permissions.middleware";
import { asyncHandler, sendSuccess } from "../common/http";
import { requireUuid } from "../common/validation/params";
import { PageQueryDto } from "../common/validation/query.dto";
import { validateDto } from "../common/validation/validate";
import {
  AttributeValueDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto
} from "./attributes.dto";
import { AttributesService } from "./attributes.service";

export function attributesRouter(service: AttributesService) {
  const router = Router();

  router.get(
    "/",
    requirePermissions("attribute:read"),
    validateDto(PageQueryDto, "query"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.list(req.validatedQuery as PageQueryDto))
    )
  );
  router.get(
    "/:id",
    requirePermissions("attribute:read"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.findOne(String(req.params.id)))
    )
  );
  router.post(
    "/",
    requirePermissions("attribute:create"),
    validateDto(CreateAttributeDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.create(req.body), 201)
    )
  );
  router.patch(
    "/:id",
    requirePermissions("attribute:update"),
    requireUuid("id"),
    validateDto(UpdateAttributeDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.update(String(req.params.id), req.body))
    )
  );
  router.post(
    "/:id/values",
    requirePermissions("attribute:update"),
    requireUuid("id"),
    validateDto(AttributeValueDto),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.addValue(String(req.params.id), req.body), 201)
    )
  );
  router.patch(
    "/:id/values/:valueId",
    requirePermissions("attribute:update"),
    requireUuid("id", "valueId"),
    validateDto(UpdateAttributeValueDto),
    asyncHandler(async (req, res) =>
      sendSuccess(
        req,
        res,
        await service.updateValue(String(req.params.id), String(req.params.valueId), req.body)
      )
    )
  );
  router.delete(
    "/:id/values/:valueId",
    requirePermissions("attribute:delete"),
    requireUuid("id", "valueId"),
    asyncHandler(async (req, res) =>
      sendSuccess(
        req,
        res,
        await service.removeValue(String(req.params.id), String(req.params.valueId))
      )
    )
  );
  router.delete(
    "/:id",
    requirePermissions("attribute:delete"),
    requireUuid("id"),
    asyncHandler(async (req, res) =>
      sendSuccess(req, res, await service.remove(String(req.params.id)))
    )
  );
  return router;
}
