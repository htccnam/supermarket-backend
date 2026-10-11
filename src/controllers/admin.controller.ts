import { NextFunction, Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

const productInput = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  salePrice: z.coerce.number().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  stock: z.coerce.number().int().nonnegative().default(0),
  lowStockAt: z.coerce.number().int().nonnegative().default(10),
  categoryId: z.string().nullable().optional()
});

const userInput = z.object({ name: z.string().min(1), email: z.string().email(), role: z.enum(["STAFF", "ADMIN"]) });

async function audit(actorId: string, action: string, entity: string, entityId?: string, details?: object) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, details } });
}

export async function dashboard(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [products, invoices, sales, lowStock, bestSelling] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
      prisma.product.count({ where: { isActive: true, stock: { lte: 10 } } }),
      prisma.invoiceItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 })
    ]);
    const productIds = bestSelling.map((item) => item.productId);
    const productNames = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
    res.json({ products, invoices, revenue: sales._sum.total ?? 0, lowStock, bestSelling: bestSelling.map((item) => ({ product: productNames.find((product) => product.id === item.productId)?.name ?? item.productId, quantity: item._sum.quantity ?? 0 })) });
  } catch (error) { next(error); }
}

export async function listInvoices(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await prisma.invoice.findMany({ include: { createdBy: { select: { name: true, email: true } }, items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 100 }));
  } catch (error) { next(error); }
}

export async function cancelInvoice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reason = z.object({ reason: z.string().min(3) }).parse(req.body).reason;
    const invoice = await prisma.$transaction(async (tx) => {
      const current = await tx.invoice.findUnique({ where: { id: String(req.params.id) }, include: { items: true } });
      if (!current) throw new AppError(404, "Invoice not found");
      if (current.status === "CANCELLED") throw new AppError(409, "Invoice is already cancelled");
      for (const item of current.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryMovement.create({ data: { productId: item.productId, type: "RETURN", quantity: item.quantity, reason: `Invoice ${current.code} cancelled` } });
      }
      return tx.invoice.update({ where: { id: current.id }, data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() } });
    });
    await audit(req.user!.id, "INVOICE_CANCELLED", "Invoice", invoice.id, { reason });
    res.json(invoice);
  } catch (error) { next(error); }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = productInput.parse(req.body);
    const product = await prisma.product.create({ data });
    await audit(req.user!.id, "PRODUCT_CREATED", "Product", product.id, { sku: product.sku });
    res.status(201).json(product);
  } catch (error) { next(error); }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = productInput.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: String(req.params.id) }, data });
    await audit(req.user!.id, "PRODUCT_UPDATED", "Product", product.id, data);
    res.json(product);
  } catch (error) { next(error); }
}

export async function toggleProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.update({ where: { id: String(req.params.id) }, data: { isActive: z.boolean().parse(req.body.isActive) } });
    await audit(req.user!.id, "PRODUCT_STATUS_CHANGED", "Product", product.id, { isActive: product.isActive });
    res.json(product);
  } catch (error) { next(error); }
}

export async function adjustStock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z.object({ quantity: z.number().int(), reason: z.string().min(3) }).parse(req.body);
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id: String(req.params.id) }, data: { stock: { increment: data.quantity } } });
      await tx.inventoryMovement.create({ data: { productId: updated.id, type: "ADJUSTMENT", quantity: data.quantity, reason: data.reason } });
      return updated;
    });
    await audit(req.user!.id, "STOCK_ADJUSTED", "Product", product.id, data);
    res.json(product);
  } catch (error) { next(error); }
}

export async function listUsers(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: "desc" } })); } catch (error) { next(error); }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = userInput.parse(req.body);
    const bcrypt = await import("bcryptjs");
    const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash("ChangeMe@123", 12) }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    await audit(req.user!.id, "USER_CREATED", "User", user.id, { role: user.role });
    res.status(201).json(user);
  } catch (error) { next(error); }
}

export async function toggleUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.user!.id) throw new AppError(400, "You cannot disable your own account");
    const target = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!target) throw new AppError(404, "User not found");
    if (target.role === "ADMIN" && target.isActive) {
      const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
      if (admins <= 1) throw new AppError(409, "Cannot disable the last active admin");
    }
    const user = await prisma.user.update({ where: { id: target.id }, data: { isActive: !target.isActive }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    await audit(req.user!.id, "USER_STATUS_CHANGED", "User", user.id, { isActive: user.isActive });
    res.json(user);
  } catch (error) { next(error); }
}

export async function auditLogs(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await prisma.auditLog.findMany({ include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 100 })); } catch (error) { next(error); }
}
