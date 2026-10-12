import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export type AuthRequest = Request & { user?: { id: string; role: Role } };

function isAuthPayload(value: unknown): value is { id: string; role: Role } {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.id === "string" && Object.values(Role).includes(payload.role as Role);
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (!isAuthPayload(payload)) return next(new AppError(401, "Invalid token payload"));
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, "Invalid or expired token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, "Insufficient permissions"));
    next();
  };
}
