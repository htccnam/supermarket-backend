import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, "Invalid credentials");
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "8h" });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
