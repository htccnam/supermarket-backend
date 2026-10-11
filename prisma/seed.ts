import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@supermarket.local" },
    update: {},
    create: { email: "admin@supermarket.local", name: "Store Admin", passwordHash, role: Role.ADMIN }
  });
  const category = await prisma.category.upsert({
    where: { name: "Grocery" },
    update: {},
    create: { name: "Grocery" }
  });
  await prisma.product.upsert({
    where: { sku: "MILK-001" },
    update: {},
    create: { sku: "MILK-001", name: "Fresh milk", salePrice: 32000, costPrice: 25000, unit: "box", stock: 50, categoryId: category.id }
  });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "SEED_CREATED", entity: "SYSTEM", details: { safe: true } } });
}

main().finally(() => prisma.$disconnect());
