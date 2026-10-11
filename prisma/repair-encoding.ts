import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const repairedProduct = await prisma.product.updateMany({
    where: { sku: { startsWith: "TEST-" }, name: { contains: "?" } },
    data: { name: "\u0053\u1ea3\u006e \u0070\u0068\u1ea9\u006d \u006b\u0069\u1ec3\u006d \u0074\u0068\u1eed", unit: "\u0063\u00e1\u0069" }
  });
  const repairedUser = await prisma.user.updateMany({
    where: { email: { endsWith: "@test.local" }, name: { contains: "?" } },
    data: { name: "\u004e\u0068\u00e2\u006e \u0076\u0069\u00ea\u006e \u006b\u0069\u1ec3\u006d \u0074\u0068\u1eed" }
  });
  console.log(`Đã sửa ${repairedProduct.count} sản phẩm và ${repairedUser.count} tài khoản bị lỗi mã hóa.`);
}

main()
  .catch((error) => {
    console.error("Không thể sửa dữ liệu mã hóa:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
