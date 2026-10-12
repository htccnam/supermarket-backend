import { beforeEach, describe, expect, it, vi } from "vitest";
import { login } from "./auth.service";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn()
  }
}));

vi.mock("../utils/prisma", () => ({ prisma: prismaMock }));
vi.mock("../config/env", () => ({ env: { JWT_SECRET: "a-secure-test-secret" } }));

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(login("missing@example.com", "password")).rejects.toMatchObject({
      statusCode: 401
    });
  });

  it("returns a token and safe user fields for valid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "staff@example.com",
      name: "Staff",
      role: "STAFF",
      isActive: true,
      passwordHash: "$2b$10$6alzX5ILoYtvdso3u3dOjO7.vwKiXIoZAJ5C.n2XuHWSDOHCB1k9e"
    });

    const result = await login("staff@example.com", "password");

    expect(result.user).toEqual({
      id: "user-1",
      email: "staff@example.com",
      name: "Staff",
      role: "STAFF"
    });
    expect(result).not.toHaveProperty("user.passwordHash");
    expect(result.token).toEqual(expect.any(String));
  });
});
