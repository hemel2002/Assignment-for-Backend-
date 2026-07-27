import { Prisma } from "@prisma/client";
import { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "./http-error";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new HttpError(404, `Route ${request.method} ${request.path} not found`, "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (
  exception,
  request,
  response,
  _next
) => {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message: string | string[] = "An unexpected error occurred";
  let errors: unknown;

  if (exception instanceof HttpError) {
    status = exception.status;
    code = exception.code ?? statusCodeName(status);
    message = exception.publicMessage;
    errors = exception.errors;
  } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === "P2002") {
      status = 409;
      code = "UNIQUE_CONFLICT";
      message = `A record with this ${formatTarget(exception.meta?.target)} already exists`;
    } else if (exception.code === "P2003" || exception.code === "P2014") {
      status = 409;
      code = "RELATION_CONFLICT";
      message = "This record is still referenced and cannot be changed";
    } else if (exception.code === "P2025") {
      status = 404;
      code = "NOT_FOUND";
      message = "The requested record was not found";
    }
  } else if (
    exception instanceof SyntaxError &&
    "body" in (exception as object)
  ) {
    status = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON";
  }

  if (status === 500 && process.env.NODE_ENV !== "test") {
    console.error(exception);
  }
  response.status(status).json({
    success: false,
    error: { code, message, ...(errors ? { errors } : {}) },
    path: request.originalUrl,
    timestamp: new Date().toISOString()
  });
};

function statusCodeName(status: number) {
  const names: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    429: "TOO_MANY_REQUESTS"
  };
  return names[status] ?? "REQUEST_ERROR";
}

function formatTarget(target: unknown) {
  return Array.isArray(target) ? target.join(", ") : "unique field";
}
