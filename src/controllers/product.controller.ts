import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const search = String(req.query.search ?? "");
    res.json(await prisma.product.findMany({ where: { isActive: true, OR: [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }] }, orderBy: { name: "asc" } }));
  } catch (error) { next(error); }
}
