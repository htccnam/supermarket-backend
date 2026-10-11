import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { login } from "../services/auth.service";

const input = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const data = input.parse(req.body);
    const result = await login(data.email, data.password);
    res.cookie("token", result.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
    res.json({ user: result.user });
  } catch (error) { next(error); }
}
export function postLogout(_req: Request, res: Response) { res.clearCookie("token"); res.status(204).send(); }
