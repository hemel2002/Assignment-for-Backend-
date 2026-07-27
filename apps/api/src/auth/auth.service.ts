import * as bcrypt from "bcrypt";
import { createHash, randomBytes, randomUUID } from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { accessSecret } from "../common/auth/access-token.middleware";
import {
  TooManyRequestsError,
  UnauthorizedError
} from "../common/errors/http-error";
import { PrismaService } from "../prisma/prisma.service";

export class AuthService {
  private readonly attempts = new Map<
    string,
    { count: number; windowStartedAt: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, rateLimitKey: string) {
    this.checkRateLimit(rateLimitKey);
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { role: true }
    });
    const passwordValid =
      !!user && (await bcrypt.compare(password, user.passwordHash));
    if (!passwordValid || !user?.active || !user.role.active) {
      this.recordFailure(rateLimitKey);
      throw new UnauthorizedError("Invalid email or password");
    }
    this.attempts.delete(rateLimitKey);
    const familyId = randomUUID();
    const refreshToken = await this.createSession(user.id, familyId);
    return {
      accessToken: await this.signAccessToken(user.id),
      refreshToken
    };
  }

  async refresh(rawToken?: string) {
    if (!rawToken) throw new UnauthorizedError("Refresh token is required");
    const [sessionId] = rawToken.split(".");
    if (!sessionId) throw new UnauthorizedError("Invalid refresh token");

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { include: { role: true } } }
    });
    if (
      !session ||
      session.tokenHash !== hash(rawToken) ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (session.revokedAt) {
      await this.prisma.session.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      throw new UnauthorizedError("Refresh token reuse detected");
    }
    if (!session.user.active || !session.user.role.active) {
      await this.revoke(rawToken);
      throw new UnauthorizedError("Account is inactive or unavailable");
    }

    const replacementId = randomUUID();
    const replacementRaw = token(replacementId);
    const expiresAt = this.refreshExpiry();
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), replacedById: replacementId }
      }),
      this.prisma.session.create({
        data: {
          id: replacementId,
          userId: session.userId,
          familyId: session.familyId,
          tokenHash: hash(replacementRaw),
          expiresAt
        }
      })
    ]);
    return {
      accessToken: await this.signAccessToken(session.userId),
      refreshToken: replacementRaw
    };
  }

  async revoke(rawToken?: string) {
    if (!rawToken) return;
    const [sessionId] = rawToken.split(".");
    if (!sessionId) return;
    await this.prisma.session.updateMany({
      where: { id: sessionId, tokenHash: hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async session(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: { select: { id: true, publicUrl: true, thumbnailUrl: true } },
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: { permission: { select: { name: true } } }
            }
          }
        }
      }
    });
    return {
      ...user,
      permissions: user.role.permissions.map((item) => item.permission.name),
      role: { id: user.role.id, name: user.role.name }
    };
  }

  private async createSession(userId: string, familyId: string) {
    const id = randomUUID();
    const rawToken = token(id);
    await this.prisma.session.create({
      data: {
        id,
        userId,
        familyId,
        tokenHash: hash(rawToken),
        expiresAt: this.refreshExpiry()
      }
    });
    return rawToken;
  }

  private signAccessToken(userId: string) {
    return Promise.resolve(
      jwt.sign({ sub: userId, type: "access" }, accessSecret(), {
        expiresIn: (process.env.JWT_ACCESS_TTL ??
          "15m") as SignOptions["expiresIn"]
      })
    );
  }

  private refreshExpiry() {
    const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private checkRateLimit(key: string) {
    const state = this.attempts.get(key);
    const now = Date.now();
    if (!state || now - state.windowStartedAt > 15 * 60_000) return;
    if (state.count >= 5) {
      throw new TooManyRequestsError(
        "Too many login attempts. Try again in 15 minutes."
      );
    }
  }

  private recordFailure(key: string) {
    const state = this.attempts.get(key);
    const now = Date.now();
    if (!state || now - state.windowStartedAt > 15 * 60_000) {
      this.attempts.set(key, { count: 1, windowStartedAt: now });
    } else {
      state.count += 1;
    }
  }
}

const token = (id: string) => `${id}.${randomBytes(48).toString("base64url")}`;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
