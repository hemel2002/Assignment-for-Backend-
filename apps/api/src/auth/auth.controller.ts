import { Router } from "express";
import { authenticate } from "../common/auth/access-token.middleware";
import { UnauthorizedError } from "../common/errors/http-error";
import { asyncHandler, sendSuccess } from "../common/http";
import { validateDto } from "../common/validation/validate";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";

const COOKIE_NAME = "trends_bird_refresh";

export function authRouter(service: AuthService, prisma: PrismaService) {
  const router = Router();

  router.post(
    "/login",
    validateDto(LoginDto),
    asyncHandler(async (request, response) => {
      const dto = request.body as LoginDto;
      const result = await service.login(
        dto.email,
        dto.password,
        request.ip ?? "unknown"
      );
      setRefreshCookie(response, result.refreshToken);
      sendSuccess(request, response, { accessToken: result.accessToken });
    })
  );

  router.post(
    "/refresh",
    asyncHandler(async (request, response) => {
      const result = await service.refresh(request.cookies?.[COOKIE_NAME]);
      setRefreshCookie(response, result.refreshToken);
      sendSuccess(request, response, { accessToken: result.accessToken });
    })
  );

  router.post(
    "/logout",
    asyncHandler(async (request, response) => {
      await service.revoke(request.cookies?.[COOKIE_NAME]);
      response.clearCookie(COOKIE_NAME, { path: "/api/auth" });
      sendSuccess(request, response, { message: "Logged out successfully" });
    })
  );

  router.get(
    "/session",
    authenticate(prisma),
    asyncHandler(async (request, response) => {
      if (!request.user) throw new UnauthorizedError("Authentication is required");
      sendSuccess(request, response, await service.session(request.user.id));
    })
  );

  return router;
}

function setRefreshCookie(
  response: import("express").Response,
  refreshToken: string
) {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  response.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: days * 24 * 60 * 60 * 1000
  });
}
