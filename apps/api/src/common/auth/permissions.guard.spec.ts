import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard";

describe("PermissionsGuard", () => {
  const context = (permissions: string[]) =>
    ({
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { permissions } })
      })
    }) as unknown as ExecutionContext;

  it("allows a user holding every required permission", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["product:delete"])
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context(["product:delete"]))).toBe(true);
  });

  it("returns 403 when a valid user lacks a required permission", () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(["user:delete"])
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(context(["user:read"]))).toThrow(
      ForbiddenException
    );
  });

  it("allows explicitly public endpoints", () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValueOnce(true)
    } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(context([]))).toBe(true);
  });
});
