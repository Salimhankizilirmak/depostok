"use server";

import { db } from "@/db";
import { products, stockMovements, companies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  // 3) Kritik stok kontrolü (Refetch updated stock and company admin info)
  if (type === "out") {
    const updatedProduct = await db
      .select({
        name: products.name,
        currentStock: products.currentStock,
        adminEmail: companies.adminEmail,
      })
      .from(products)
      .innerJoin(companies, eq(products.companyId, companies.id))
      .where(eq(products.id, productId))
      .limit(1)
      .then((r: any[]) => r[0] ?? null);

    if (updatedProduct && updatedProduct.currentStock <= 10) {
      try {
        await resend.emails.send({
          from: "Novexis Stok <onboarding@resend.dev>",
          to: [updatedProduct.adminEmail],
          subject: "⚠️ KRİTİK STOK UYARISI!",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #e11d48;">Kritik Stok Uyarısı!</h2>
              <p>Dikkat! <strong>${updatedProduct.name}</strong> isimli ürününüzün stoğu kritik seviyeye ( <strong>${updatedProduct.currentStock}</strong> adet ) düşmüştür.</p>
              <p>Lütfen tedarik planlamanızı yapınız.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Bu otomatik bir bilgilendirme mesajıdır.</p>
            </div>
          `,
        });
        console.log(`Alert sent to ${updatedProduct.adminEmail} for ${updatedProduct.name}`);
      } catch (error) {
        console.error("Email sending failed:", error);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
}
