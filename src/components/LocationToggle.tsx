"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateCompanySettings } from "@/actions/settings";
import { toast } from "sonner";

interface LocationToggleProps {
  companyId: string;
  initialValue: boolean;
}

export default function LocationToggle({ companyId, initialValue }: LocationToggleProps) {
  const t = useTranslations("Dashboard");
  const [enabled, setEnabled] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (newValue: boolean) => {
    // UI'da anında güncelle
    setEnabled(newValue);

    startTransition(async () => {
      try {
        await updateCompanySettings(companyId, { locationSystemEnabled: newValue });
        toast.success(t("locationSystemUpdateSuccess"));
      } catch (error) {
        toast.error(t("importError")); // Genel bir hata mesajı
        setEnabled(!newValue); // Hata durumunda geri al
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-6 bg-slate-900/50 border border-slate-800 rounded-3xl group hover:border-emerald-500/30 transition-all duration-300">
      <div className="space-y-1">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          {t("activateLocationSystem")}
          {isPending && <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
          {t("locationSystemDesc")}
        </p>
      </div>

      <button
        onClick={() => handleToggle(!enabled)}
        disabled={isPending}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
          enabled ? "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
