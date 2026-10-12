import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentMethod } from "@prisma/client";
import { createInvoice } from "./invoice.service";

const { transactionMock, prismaMock } = vi.hoisted(() => {
  const transactionMock = vi.fn();
  return { transactionMock, prismaMock: { $transaction: transactionMock } };
});

vi.mock("../utils/prisma", () => ({ prisma: prismaMock }));

describe("invoice service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an empty invoice before opening a transaction", async () => {
    await expect(createInvoice("user-1", [], PaymentMethod.CASH)).rejects.toMatchObject({
      statusCode: 400
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejects non-positive quantities before querying products", async () => {
    const tx = {
      product: { findMany: vi.fn().mockResolvedValue([{ id: "product-1", name: "Milk", stock: 5, salePrice: 10 }]) }
    };
    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(
      createInvoice("user-1", [{ productId: "product-1", quantity: 0 }], PaymentMethod.CASH)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(tx.product.findMany).toHaveBeenCalledOnce();
  });

  it("rejects a sale when stock is insufficient", async () => {
    const tx = {
      product: { findMany: vi.fn().mockResolvedValue([{ id: "product-1", name: "Milk", stock: 1, salePrice: 10 }]) },
      productUpdate: vi.fn()
    };
    transactionMock.mockImplementation(async (callback) => callback(tx));

    await expect(
      createInvoice("user-1", [{ productId: "product-1", quantity: 2 }], PaymentMethod.CASH)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
