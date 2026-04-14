"use server";
import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/db";
import { products, stockMovements, companies } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";

export async function addProduct(companyId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const currentStock = parseInt(formData.get("current_stock") as string) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const criticalThreshold = parseInt(formData.get("critical_threshold") as string) || 10;
  const location = formData.get("location") as string;
  const attributes = formData.get("attributes") as string;

  if (!name) {
    throw new Error("Ürün adı zorunludur.");
  }

  await db.insert(products).values({
    companyId,
    name: name.trim(),
    sku: sku?.trim() || null,
    currentStock,
    price,
    criticalThreshold,
    location: location?.trim() || null,
    attributes: attributes || null,
  });

  revalidatePath("/dashboard");
}

export async function updateStock(
  productId: string,
  companyId: string,
  type: "in" | "out",
  quantity: number,
  description: string
) {
  if (quantity <= 0) throw new Error("Miktar 0'dan büyük olmalıdır.");
  if (!description) throw new Error("Açıklama zorunludur.");

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "system";

  // 1) Hareketi kaydet
  await db.insert(stockMovements).values({
    productId,
    companyId,
    type,
    quantity,
    description,
    userEmail,
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
    const [updatedProduct] = await db
      .select({
        name: products.name,
        currentStock: products.currentStock,
        criticalThreshold: products.criticalThreshold,
        adminEmail: companies.adminEmail,
      })
      .from(products)
      .innerJoin(companies, eq(products.companyId, companies.id))
      .where(eq(products.id, productId))
      .limit(1);

    if (updatedProduct && updatedProduct.currentStock <= updatedProduct.criticalThreshold) {
      try {
        await sendMail({
          to: updatedProduct.adminEmail,
          subject: "⚠️ KRİTİK STOK UYARISI!",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #e11d48;">Kritik Stok Uyarısı!</h2>
              <p>Dikkat! <strong>${updatedProduct.name}</strong> isimli ürününüzün stoğu kritik seviyeye ( <strong>${updatedProduct.currentStock}</strong> ${updatedProduct.currentStock === updatedProduct.criticalThreshold ? 'altına' : 'seviyesine'} düşmüştür.</p>
              <p>Belirlediğiniz kritik eşik: <strong>${updatedProduct.criticalThreshold}</strong> adet.</p>
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

export async function importProducts(companyId: string, productsArray: any[]) {
  const user = await currentUser();
  if (!user) throw new Error("Oturum açılmadı.");

  // Dizi boşsa çık
  if (productsArray.length === 0) return;

  // Veriyi database formatına çevir
  const values = productsArray.map((p) => ({
    companyId,
    name: p.name,
    sku: p.sku || null,
    currentStock: p.currentStock || 0,
    price: p.price || 0,
    criticalThreshold: p.criticalThreshold || 10,
    location: p.location || null,
    attributes: p.attributes ? JSON.stringify(p.attributes) : null,
  }));

  // Chunking (toplu ekleme sınırı varsa diye, ama burada direkt ekliyoruz)
  await db
    .insert(products)
    .values(values)
    .onConflictDoNothing({ target: [products.companyId, products.sku] });

  revalidatePath("/dashboard");
}

export async function deleteProduct(productId: string, companyId: string) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  if (!firma || firma.id !== companyId || firma.userRole !== "Yönetici") {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  await db.delete(products).where(eq(products.id, productId));

  revalidatePath("/dashboard");
}
