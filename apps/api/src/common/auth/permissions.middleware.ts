import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/http-error";

export const requirePermissions =
  (...required: string[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      return next(new UnauthorizedError("Authentication is required"));
    }
    const allowed = required.every((permission) =>
      request.user?.permissions.includes(permission)
    );
    if (!allowed) {
      return next(
        new ForbiddenError(
          `Missing required permission: ${required.join(", ")}`
        )
      );
    }
    next();
  };
