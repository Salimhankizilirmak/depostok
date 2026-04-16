"use server";
import { currentUser } from "@clerk/nextjs/server";

import { db } from "@/db";
import { products, stockMovements, companies, productTrees } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";

export async function addProduct(companyId: string, formData: FormData) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Yetkili", "Mühendis"];
  
  if (!firma || firma.id !== companyId || !allowedRoles.includes(firma.userRole)) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const currentStock = parseInt(formData.get("current_stock") as string) || 0;
  const price = parseFloat(formData.get("price") as string) || 0;
  const criticalThreshold = parseInt(formData.get("critical_threshold") as string) || 10;
  const location = formData.get("location") as string;
  const attributes = formData.get("attributes") as string;
  const unit = (formData.get("unit") as string) || "Adet";

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
    unit: unit.trim(),
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

  // Güvenlik kontrolü: Kullanıcı bu firmaya ait mi?
  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const belongsToCompany = await getCompanyAndRole(userEmail);
  if (!belongsToCompany || belongsToCompany.id !== companyId) {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

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
  const [firma] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  if (type === "out" && firma?.bomSystemEnabled) {
    const components = await db
      .select()
      .from(productTrees)
      .where(eq(productTrees.parentProductId, productId));
    if (components.length > 0) {
      await Promise.all(
        components.map(async (comp: { childProductId: string; quantity: number }) => {
          const deduction = quantity * comp.quantity;

          // Bileşen stok düşüşü
          await db
            .update(products)
            .set({ currentStock: sql`${products.currentStock} - ${deduction}` })
            .where(eq(products.id, comp.childProductId));

          // Bileşen hareketi kaydet
          await db.insert(stockMovements).values({
            productId: comp.childProductId,
            companyId,
            type: "out",
            quantity: deduction,
            description: `BOM Montaj Çıkışı (${description})`,
            userEmail,
          });

          // Bileşen için kritik stok kontrolü
          await checkAndNotifyCriticalStock(comp.childProductId);
        })
      );
      revalidatePath("/dashboard");
      return; // Ana üründen düşme
    }
  }

  await db
    .update(products)
    .set({
      currentStock:
        type === "in"
          ? sql`${products.currentStock} + ${quantity}`
          : sql`${products.currentStock} - ${quantity}`,
    })
    .where(eq(products.id, productId));

  // 3) Kritik stok kontrolü
  if (type === "out") {
    await checkAndNotifyCriticalStock(productId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
}

export async function importProducts(
  companyId: string,
  productsArray: {
    name: string;
    sku?: string;
    currentStock?: number;
    price?: number;
    criticalThreshold?: number;
    location?: string;
    attributes?: any;
    unit?: string;
  }[]
) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  // Role kontrolü
  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Yetkili", "Mühendis"];

  if (!firma || firma.id !== companyId || !allowedRoles.includes(firma.userRole)) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  // Dizi boşsa çık
  if (productsArray.length === 0) return { success: true, count: 0 };

  const batchId = crypto.randomUUID();

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
    unit: p.unit || "Adet",
    importBatchId: batchId,
  }));

  // Chunking
  await db
    .insert(products)
    .values(values)
    .onConflictDoNothing({ target: [products.companyId, products.sku] });

  revalidatePath("/dashboard");
  return { success: true, count: values.length, batchId };
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

export async function undoImportProducts(batchId: string, companyId: string) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  if (!firma || firma.id !== companyId || firma.userRole !== "Yönetici") {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  await db.delete(products).where(eq(products.importBatchId, batchId));

  revalidatePath("/dashboard");
}

export async function updateProduct(productId: string, companyId: string, data: {
  name?: string;
  sku?: string | null;
  price?: number;
  criticalThreshold?: number;
  location?: string | null;
  attributes?: string | null;
  unit?: string;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  // Role kontrolü (Sadece Yönetici)
  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  if (!firma || firma.id !== companyId || (firma.userRole !== "Yönetici" && firma.userRole !== "Super Admin")) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  await db.update(products).set({
    ...data,
  }).where(and(eq(products.id, productId), eq(products.companyId, companyId)));

  revalidatePath("/dashboard");
}

async function checkAndNotifyCriticalStock(productId: string) {
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
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
    }
  }
}
