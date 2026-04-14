import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import DashboardNav from "@/components/DashboardNav";
import { getCompanyAndRole } from "@/lib/auth-repair";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const firma = email ? await getCompanyAndRole(email) : null;

  const t = await getTranslations("Dashboard");

  // ── Yetkisiz erişim ──────────────────────────────────────────────────────────
  if (!firma) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/50 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">{t("accessDenied")}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t("noCompanyFound")}
          </p>
          {email && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-800 rounded-lg px-3 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              {email}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Yetkili Dashboard Layout ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Firma Adı + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {firma.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-white font-semibold text-sm tracking-tight truncate block">
                {firma.name}
              </span>
              <span className="block text-slate-500 text-[10px] sm:text-xs">
                {t("companyPanel")}
              </span>
            </div>
          </div>

          {/* Sağ taraf */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            {/* Navigasyon linkleri */}
            <DashboardNav userRole={firma.userRole} />
            <div className="h-5 w-px bg-slate-800" />
            <UserButton />
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
