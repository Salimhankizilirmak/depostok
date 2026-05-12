import { currentUser } from "@clerk/nextjs/server";
import { getCompanyAndRole } from "@/lib/auth-repair";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import BOMToggle from "@/components/BOMToggle";
import IdentityBinder from "@/components/IdentityBinder";
import WarehouseSettings from "@/components/WarehouseSettings";

export default async function SettingsPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);
  if (!firma) redirect("/");

  // Sadece Yönetici
  if (firma.userRole !== "Yönetici") {
    redirect("/dashboard");
  }

  const t = await getTranslations("Dashboard");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t("settings")}</h1>
        <p className="text-slate-400 text-sm">{t("companyPanel")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <WarehouseSettings
            companyId={firma.id}
            initialEnabled={firma.locationSystemEnabled}
            initialFormat={firma.locationFormat}
          />

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl shadow-black/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Sistem Ayarları</h2>
            </div>

            <BOMToggle 
              companyId={firma.id} 
              initialValue={firma.bomSystemEnabled} 
            />
          </div>
        </div>

        <IdentityBinder />
      </div>
    </div>
  );
}
