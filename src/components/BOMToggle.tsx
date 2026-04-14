"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateCompanySettings } from "@/actions/settings";
import { toast } from "sonner";

interface BOMToggleProps {
  companyId: string;
  initialEnabled: boolean;
}

export default function BOMToggle({ companyId, initialEnabled }: BOMToggleProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (enabled: boolean) => {
    startTransition(async () => {
      try {
        await updateCompanySettings(companyId, { bomSystemEnabled: enabled });
        toast.success(t("locationSystemUpdateSuccess"));
      } catch (error) {
        toast.error("Ayarlar güncellenirken bir hata oluştu.");
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
      <div>
        <h3 className="text-sm font-bold text-white mb-1">{t("bomSystem")}</h3>
        <p className="text-xs text-slate-400">{t("bomSystemDesc")}</p>
      </div>
      
      <button
        onClick={() => handleToggle(!initialEnabled)}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          initialEnabled ? "bg-indigo-600" : "bg-slate-700"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            initialEnabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
