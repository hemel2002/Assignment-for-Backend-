import { Request, Response } from "express";
import { ForbiddenError } from "../errors/http-error";
import { requirePermissions } from "./permissions.middleware";

describe("requirePermissions", () => {
  const response = {} as Response;

  it("allows a user holding every required permission", () => {
    const request = {
      user: { permissions: ["product:delete"] }
    } as unknown as Request;
    const next = jest.fn();

    requirePermissions("product:delete")(request, response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("returns a forbidden error when permission is missing", () => {
    const request = {
      user: { permissions: ["user:read"] }
    } as unknown as Request;
    const next = jest.fn();

    requirePermissions("user:delete")(request, response, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });
});
