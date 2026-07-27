import { isUUID } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors/http-error";

export const requireUuid =
  (...names: string[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    for (const name of names) {
      if (!isUUID(request.params[name], "4")) {
        return next(new BadRequestError(`${name} must be a UUID`));
      }
    }
    next();
  };
