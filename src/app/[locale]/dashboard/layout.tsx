import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import DashboardNav from "@/components/DashboardNav";
import { getCompanyAndRole } from "@/lib/auth-repair";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "@/lib/mail";
import UnauthorizedUI from "@/components/UnauthorizedUI";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  const fullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "Yöneticimiz";

  const firma = email ? await getCompanyAndRole(email) : null;

  // ── Hoş Geldin Maili Tetikleyicisi ───────────────────────────────────────────
  if (firma && !firma.welcomeEmailSent && email) {
    // 1) Maili gönder (Non-blocking)
    sendWelcomeEmail(email, fullName || "Yöneticimiz").catch(err => {
      console.error("Hoş geldin maili gönderim hatası:", err);
    });

    // 2) Veritabanında flag'i güncelle (Async)
    db.update(companies)
      .set({ welcomeEmailSent: true })
      .where(eq(companies.id, firma.id))
      .catch(err => console.error("DB welcomeEmailSent update hatası:", err));
  }

  const t = await getTranslations("Dashboard");

  // ── Yetkisiz erişim ──────────────────────────────────────────────────────────
  if (!firma) {
    return (
      <UnauthorizedUI 
        email={email} 
        accessDeniedText={t("accessDenied")} 
        noCompanyFoundText={t("noCompanyFound")} 
      />
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
