"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { updateCompanyWarehouseSettings } from "@/actions/team";

interface WarehouseSettingsProps {
  companyId: string;
  initialEnabled: boolean;
  initialFormat: string;
}

export default function WarehouseSettings({
  companyId,
  initialEnabled,
  initialFormat,
}: WarehouseSettingsProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [format, setFormat] = useState(initialFormat);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateCompanyWarehouseSettings(companyId, enabled, format);
      } catch (error) {
        console.error("Settings update failed:", error);
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8V21H3V8" /><path d="M23 3H1V8H23V3Z" /><path d="M10 12H14" />
          </svg>
        </div>
        <h2 className="text-white font-semibold text-sm">{t("warehouseSettings")}</h2>
      </div>

      <div className="space-y-6">
        {/* Toggle System */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">{t("locationSystemEnabled")}</p>
            <p className="text-slate-500 text-xs mt-0.5">{t("locationSystemDesc")}</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              enabled ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Format Selection (Conditional) */}
        {enabled && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-medium text-slate-400 mb-2">{t("locationFormat")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setFormat("free")}
                className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                  format === "free"
                    ? "bg-blue-600/10 border-blue-600 ring-1 ring-blue-600"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="text-white text-xs font-bold">{t("freeText")}</span>
                <span className="text-slate-500 text-[10px] mt-1">A-1-2, Raf 5, Koridor 12...</span>
              </button>
              <button
                onClick={() => setFormat("hierarchical")}
                className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                  format === "hierarchical"
                    ? "bg-blue-600/10 border-blue-600 ring-1 ring-blue-600"
                    : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="text-white text-xs font-bold">{t("hierarchical")}</span>
                <span className="text-slate-500 text-[10px] mt-1">Koridor - Raf - Sıra</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || (enabled === initialEnabled && format === initialFormat)}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            {isPending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
