import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";
import { UnauthorizedError } from "../errors/http-error";

type AccessPayload = jwt.JwtPayload & { sub: string; type: string };

export const authenticate =
  (prisma: PrismaService) =>
  async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const [scheme, token] = (request.headers.authorization ?? "").split(" ");
      if (scheme !== "Bearer" || !token) {
        throw new UnauthorizedError("A valid access token is required");
      }

      let payload: AccessPayload;
      try {
        payload = jwt.verify(token, accessSecret()) as AccessPayload;
      } catch {
        throw new UnauthorizedError("Access token is invalid or expired");
      }
      if (payload.type !== "access" || !payload.sub) {
        throw new UnauthorizedError("Invalid token type");
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      });
      if (!user?.active || !user.role.active) {
        throw new UnauthorizedError("Account is inactive or unavailable");
      }

      request.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        role: user.role.name,
        permissions: user.role.permissions.map((item) => item.permission.name)
      };
      next();
    } catch (error) {
      next(error);
    }
  };

export function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
}
