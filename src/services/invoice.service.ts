import { PaymentMethod } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

type Line = { productId: string; quantity: number };

export async function createInvoice(userId: string, lines: Line[], paymentMethod: PaymentMethod) {
  if (!lines.length) throw new AppError(400, "Invoice must contain at least one item");
  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: lines.map((line) => line.productId) }, isActive: true } });
    const byId = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    const items = [];
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new AppError(400, "Quantity must be positive");
      const product = byId.get(line.productId);
      if (!product) throw new AppError(404, "Product not found");
      if (product.stock < line.quantity) throw new AppError(409, `Insufficient stock for ${product.name}`);
      subtotal += Number(product.salePrice) * line.quantity;
      items.push({ productId: product.id, quantity: line.quantity, unitPrice: product.salePrice });
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: line.quantity } } });
      await tx.inventoryMovement.create({ data: { productId: product.id, type: "SALE", quantity: -line.quantity, reason: "Invoice sale" } });
    }
    const invoice = await tx.invoice.create({
      data: { code: `INV-${Date.now()}`, paymentMethod, subtotal, total: subtotal, createdById: userId, items: { create: items } },
      include: { items: { include: { product: true } } }
    });
    return invoice;
  });
}
