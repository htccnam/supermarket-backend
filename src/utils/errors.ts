import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) return res.status(error.statusCode).json({ error: error.message });
  if (error instanceof ZodError) return res.status(400).json({ error: "Dữ liệu không hợp lệ", details: error.issues });
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
