"use server";

import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getCompanyAndRole } from "@/lib/auth-repair";
import { currentUser } from "@clerk/nextjs/server";

export async function getWarehouseAnalysisData(productId?: string) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Unauthorized");

  const companyInfo = await getCompanyAndRole(email);
  if (!companyInfo) throw new Error("Company not found");

  const companyId = companyInfo.id;

  // Son 12 ayın başlangıcını hesapla
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  
  const startDateStr = twelveMonthsAgo.toISOString().split('T')[0];

  // Temel sorgu
  const query = db
    .select({
      month: sql<string>`strftime('%Y-%m', ${stockMovements.createdAt})`,
      type: stockMovements.type,
      totalQuantity: sql<number>`sum(${stockMovements.quantity})`,
      totalPrice: sql<number>`sum(${stockMovements.quantity} * ${products.price})`,
      unit: products.unit,
      productName: products.name,
      productId: products.id,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .where(
      and(
        eq(stockMovements.companyId, companyId),
        gte(stockMovements.createdAt, startDateStr),
        productId ? eq(stockMovements.productId, productId) : undefined
      )
    )
    .groupBy(
      sql`strftime('%Y-%m', ${stockMovements.createdAt})`,
      stockMovements.type,
      products.id
    );

  const rawData = await query;

  // Veriyi grafik için formata sokma
  // { month: '2023-01', inQty: 10, outQty: 5, inPrice: 100, outPrice: 50 }
  
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    months.push(d.toISOString().split('T')[0].substring(0, 7));
  }

  const formattedData = months.map(m => {
    const monthData = rawData.filter(d => d.month === m);
    
    return {
      month: m,
      inQty: monthData.filter(d => d.type === 'in').reduce((acc, curr) => acc + curr.totalQuantity, 0),
      outQty: monthData.filter(d => d.type === 'out').reduce((acc, curr) => acc + curr.totalQuantity, 0),
      inPrice: monthData.filter(d => d.type === 'in').reduce((acc, curr) => acc + curr.totalPrice, 0),
      outPrice: monthData.filter(d => d.type === 'out').reduce((acc, curr) => acc + curr.totalPrice, 0),
      unit: monthData[0]?.unit || "Adet"
    };
  });

  return formattedData;
}

export async function getProductsForSearch() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Unauthorized");

  const companyInfo = await getCompanyAndRole(email);
  if (!companyInfo) throw new Error("Company not found");

  const results = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      unit: products.unit,
      price: products.price
    })
    .from(products)
    .where(eq(products.companyId, companyInfo.id));

  return results;
}
