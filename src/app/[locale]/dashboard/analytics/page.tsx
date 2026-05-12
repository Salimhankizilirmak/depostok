import { currentUser } from "@clerk/nextjs/server";
import { getCompanyAndRole } from "@/lib/auth-repair";
import AnalyticsClient from "./AnalyticsClient";
import { getTranslations } from "next-intl/server";

export default async function AnalyticsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Unauthorized");

  const companyInfo = await getCompanyAndRole(email);
  if (!companyInfo) throw new Error("Company not found");

  // Rol kontrolü: Sadece Yönetici ve Yetkili
  const allowedRoles = ["Yönetici", "Yetkili", "Super Admin"];
  if (!allowedRoles.includes(companyInfo.userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-xl mb-2">Erişim Reddedildi</h2>
        <p className="text-slate-400">Bu sayfayı görüntülemek için yeterli yetkiniz bulunmamaktadır.</p>
      </div>
    );
  }

  const t = await getTranslations("Analytics");

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t("title")}</h1>
        <p className="text-slate-400 text-sm">{t("description")}</p>
      </div>

      <AnalyticsClient />
    </div>
  );
}
