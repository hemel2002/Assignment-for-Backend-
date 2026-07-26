import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Post,
  Req,
  Res
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto } from "./auth.dto";

const COOKIE_NAME = "trends_bird_refresh";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.auth.login(dto.email, dto.password, ip);
    this.setRefreshCookie(response, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.auth.refresh(request.cookies?.[COOKIE_NAME]);
    this.setRefreshCookie(response, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Public()
  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.auth.revoke(request.cookies?.[COOKIE_NAME]);
    response.clearCookie(COOKIE_NAME, { path: "/api/auth" });
    return { message: "Logged out successfully" };
  }

  @Get("session")
  session(@Req() request: any) {
    return this.auth.session(request.user.id);
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    const days = Number(this.config.get("REFRESH_TOKEN_TTL_DAYS", 7));
    response.cookie(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.config.get("NODE_ENV") === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: days * 24 * 60 * 60 * 1000
    });
  }
}
