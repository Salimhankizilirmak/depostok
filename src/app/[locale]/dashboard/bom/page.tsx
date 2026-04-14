import { currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products, productTrees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyAndRole } from "@/lib/auth-repair";
import BOMManager from "@/components/BOMManager";
import BOMImportExcelButton from "@/components/BOMImportExcelButton";

export default async function BOMPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);
  const allowedRoles = ["Yönetici", "Super Admin", "Yetkili", "Mühendis"];

  if (!firma || !allowedRoles.includes(firma.userRole)) {
    redirect("/dashboard");
  }

  // Tüm ürünleri getir (selector için)
  const allProducts = await db.select().from(products).where(eq(products.companyId, firma.id));
  
  // Mevcut ağaçları getir
  const existingTrees = await db.select().from(productTrees).where(eq(productTrees.companyId, firma.id));

  const t = await getTranslations("Dashboard");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-white tracking-tight">{t("productTree")}</h1>
          <p className="text-slate-400 text-sm">{t("bomSystemDesc")}</p>
        </div>
        
        <BOMImportExcelButton companyId={firma.id} />
      </div>

      <BOMManager 
        companyId={firma.id} 
        products={allProducts}
        existingTrees={existingTrees}
      />
    </div>
  );
}
