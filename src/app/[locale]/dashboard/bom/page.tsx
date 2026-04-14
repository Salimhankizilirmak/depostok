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
    <div className="p-6">
      {!firma.bomSystemEnabled ? (
         <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl text-center space-y-3 mt-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                </svg>
            </div>
            <h2 className="text-amber-500 font-bold text-lg">{t("bomSystem")} Aktif Değil</h2>
            <p className="text-amber-500/70 text-sm max-w-sm mx-auto">
              {t("bomSystemDesc")} özelliğini kullanmak için Ayarlar sayfasından sistemi aktif hale getirmeniz gerekmektedir.
            </p>
         </div>
      ) : (
        <div className="space-y-6">
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
      )}
    </div>
  );
}
