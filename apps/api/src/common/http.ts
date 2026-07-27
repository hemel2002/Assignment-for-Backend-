import { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncHandler = (
  handler: (
    request: Request,
    response: Response,
    next: NextFunction
  ) => Promise<unknown>
): RequestHandler => {
  return (request, response, next) => {
    void Promise.resolve(handler(request, response, next)).catch(next);
  };
};

export function sendSuccess(
  request: Request,
  response: Response,
  data: unknown,
  status = 200
) {
  const meta =
    data && typeof data === "object" && "meta" in data
      ? (data as { meta?: unknown }).meta
      : undefined;
  return response.status(status).json({
    success: true,
    data: data ?? null,
    ...(meta === undefined ? {} : { meta }),
    path: request.originalUrl,
    timestamp: new Date().toISOString()
  });
}
