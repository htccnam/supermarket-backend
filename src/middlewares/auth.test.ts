import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AuthRequest, requireAuth } from "./auth";

vi.mock("../config/env", () => ({ env: { JWT_SECRET: "a-secure-test-secret" } }));

function requestWithToken(token: string) {
  return {
    cookies: { token },
    headers: {}
  } as unknown as AuthRequest;
}

describe("auth middleware", () => {
  it("rejects tokens without a valid user payload", () => {
    const next = vi.fn();
    const token = jwt.sign({ role: Role.STAFF }, "a-secure-test-secret");

    requireAuth(requestWithToken(token), {} as never, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("stores a valid user payload on the request", () => {
    const next = vi.fn();
    const token = jwt.sign({ id: "user-1", role: Role.ADMIN }, "a-secure-test-secret");
    const request = requestWithToken(token);

    requireAuth(request, {} as never, next);

    expect(request.user).toEqual({ id: "user-1", role: Role.ADMIN });
    expect(next).toHaveBeenCalledWith();
  });
});
