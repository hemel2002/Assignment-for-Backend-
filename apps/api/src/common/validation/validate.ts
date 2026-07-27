import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestError } from "../errors/http-error";

type RequestSource = "body" | "query";

export const validateDto = <T extends object>(
  type: ClassConstructor<T>,
  source: RequestSource = "body"
): RequestHandler => {
  return async (
    request: Request,
    _response: Response,
    next: NextFunction
  ) => {
    const instance = plainToInstance(type, request[source]);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true
    });
    if (errors.length) {
      const messages = errors.flatMap((error) =>
        error.constraints ? Object.values(error.constraints) : ["Invalid input"]
      );
      return next(new BadRequestError(messages));
    }
    if (source === "query") request.validatedQuery = instance;
    else request.body = instance;
    next();
  };
};
