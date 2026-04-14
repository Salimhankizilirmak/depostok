"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products, productTrees, stockMovements } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveBOM(companyId: string, parentProductId: string, components: { childProductId: string; quantity: number }[]) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Mühendis", "Yetkili"];
  
  if (!firma || firma.id !== companyId || !allowedRoles.includes(firma.userRole)) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  // Önce mevcut ağacı temizle
  await db.delete(productTrees).where(and(eq(productTrees.parentProductId, parentProductId), eq(productTrees.companyId, companyId)));

  // Yeni ağacı ekle
  if (components.length > 0) {
    await db.insert(productTrees).values(
      components.map((c) => ({
        companyId,
        parentProductId,
        childProductId: c.childProductId,
        quantity: c.quantity,
      }))
    );
  }

  revalidatePath("/dashboard/bom");
  revalidatePath("/dashboard");
}

export async function importBOM(companyId: string, bomRows: { parentSku: string; componentSku: string; quantity: number }[]) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Mühendis", "Yetkili"];
  if (!firma || firma.id !== companyId || !allowedRoles.includes(firma.userRole)) {
    throw new Error("Yetkisiz işlem.");
  }

  // SKU'ları ürün ID'leri ile eşleştir
  const skus = new Set<string>();
  bomRows.forEach(r => {
    skus.add(r.parentSku);
    skus.add(r.componentSku);
  });

  const productList = await db.select().from(products).where(eq(products.companyId, companyId));
  const skuToId = new Map<string, string>();
  productList.forEach(p => {
    if (p.sku) skuToId.set(p.sku, p.id);
  });

  const valuesToInsert: any[] = [];
  bomRows.forEach(row => {
    const parentId = skuToId.get(row.parentSku);
    const componentId = skuToId.get(row.componentSku);
    
    if (parentId && componentId) {
      valuesToInsert.push({
        companyId,
        parentProductId: parentId,
        childProductId: componentId,
        quantity: row.quantity,
      });
    }
  });

  if (valuesToInsert.length > 0) {
    // Toplu ekleme öncesi temizlik yapmak riskli olabilir (sadece gelen parentId'leri mi temizlemeli?), 
    // basitleştirmek için direkt ekliyoruz. Gerçek senaryoda parent bazlı temizlik gerekebilir.
    await db.insert(productTrees).values(valuesToInsert);
  }

  revalidatePath("/dashboard/bom");
  return { success: true, count: valuesToInsert.length };
}

export async function produceItem(companyId: string, parentProductId: string, quantity: number) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Mühendis", "Yetkili"];
  if (!firma || firma.id !== companyId || !allowedRoles.includes(firma.userRole)) {
    throw new Error("Yetkisiz işlem.");
  }

  // 1. Reçeteyi bul
  const bomComponents = await db.select().from(productTrees).where(and(eq(productTrees.parentProductId, parentProductId), eq(productTrees.companyId, companyId)));
  if (bomComponents.length === 0) throw new Error("Ürün reçetesi bulunamadı.");

  const componentIds = bomComponents.map(c => c.childProductId);
  const componentProducts = await db.select().from(products).where(and(inArray(products.id, componentIds), eq(products.companyId, companyId)));
  
  const productMap = new Map(componentProducts.map(p => [p.id, p]));

  // 2. Stok kontrolü
  for (const comp of bomComponents) {
    const p = productMap.get(comp.childProductId);
    const required = comp.quantity * quantity;
    if (!p || p.currentStock < required) {
      throw new Error(`Yetersiz ham madde: ${p?.name || "Bilinmiyor"}`);
    }
  }

  // 3. Üretim işlemi (Transaction)
  await db.transaction(async (tx) => {
    // Ham madde düşüşleri
    for (const comp of bomComponents) {
        const required = comp.quantity * quantity;
        const p = productMap.get(comp.childProductId)!;
        
        await tx.update(products).set({
            currentStock: p.currentStock - required
        }).where(eq(products.id, comp.childProductId));

        await tx.insert(stockMovements).values({
            companyId,
            productId: comp.childProductId,
            type: "out",
            quantity: required,
            userEmail: email,
            description: "Üretim Çıkışı"
        });
    }

    // Mamul artışı
    const parentProduct = await tx.select().from(products).where(eq(products.id, parentProductId)).then(res => res[0]);
    await tx.update(products).set({
        currentStock: parentProduct.currentStock + quantity
    }).where(eq(products.id, parentProductId));

    await tx.insert(stockMovements).values({
        companyId,
        productId: parentProductId,
        type: "in",
        quantity,
        userEmail: email,
        description: "Üretim Girişi"
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bom");
  return { success: true };
}
