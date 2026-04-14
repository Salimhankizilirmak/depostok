import { currentUser } from "@clerk/nextjs/server";
import { getCompanyAndRole } from "@/lib/auth-repair";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import LocationToggle from "@/components/LocationToggle";
import BOMToggle from "@/components/BOMToggle";

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
        {/* Depo Ayarları Bölümü */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">{t("warehouseSettings")}</h2>
          </div>

          <LocationToggle 
            companyId={firma.id} 
            initialValue={firma.locationSystemEnabled} 
          />

          <BOMToggle 
            companyId={firma.id} 
            initialEnabled={firma.bomSystemEnabled} 
          />
        </div>

        {/* Placeholder for other settings */}
        <div className="bg-slate-900/40 border border-slate-800/60 border-dashed rounded-3xl p-8 flex items-center justify-center">
          <p className="text-slate-600 text-sm italic italic">
            Gelecekteki ayarlar buraya eklenecektir...
          </p>
        </div>
      </div>
    </div>
  );
}
