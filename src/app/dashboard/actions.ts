"use server";

import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addProduct(companyId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const currentStock = parseInt(formData.get("current_stock") as string) || 0;

  if (!name) {
    throw new Error("Ürün adı zorunludur.");
  }

  await db.insert(products).values({
    companyId,
    name: name.trim(),
    sku: sku?.trim() || null,
    currentStock,
  });

  revalidatePath("/dashboard");
}

export async function updateStock(
  productId: string,
  companyId: string,
  type: "in" | "out",
  quantity: number
) {
  if (quantity <= 0) throw new Error("Miktar 0'dan büyük olmalıdır.");

  // 1) Hareketi kaydet
  await db.insert(stockMovements).values({
    productId,
    companyId,
    type,
    quantity,
  });

  // 2) Ürün stok miktarını güncelle
  await db
    .update(products)
    .set({
      currentStock:
        type === "in"
          ? sql`${products.currentStock} + ${quantity}`
          : sql`${products.currentStock} - ${quantity}`,
    })
    .where(eq(products.id, productId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
}
