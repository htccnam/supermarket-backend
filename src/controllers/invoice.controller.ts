import { Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { z } from "zod";
import { PaymentMethod } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth";
import { createInvoice } from "../services/invoice.service";
const input = z.object({ paymentMethod: z.nativeEnum(PaymentMethod), items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1) });
export async function postInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try { res.status(201).json(await createInvoice(req.user!.id, input.parse(req.body).items, input.parse(req.body).paymentMethod)); } catch (error) { next(error); }
}
export async function listMyInvoices(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const search = String(req.query.search ?? "");
    const invoices = await prisma.invoice.findMany({
      where: { createdById: req.user!.id, ...(search ? { code: { contains: search, mode: "insensitive" } } : {}) },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(invoices);
  } catch (error) { next(error); }
}
