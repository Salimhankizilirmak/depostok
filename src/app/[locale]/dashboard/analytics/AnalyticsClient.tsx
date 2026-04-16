"use client";

import { useState } from "react";
import AnalyticsSearch from "@/components/AnalyticsSearch";
import AnalyticsChartCard from "@/components/AnalyticsChartCard";
import MergedAnalyticsChart from "@/components/MergedAnalyticsChart";
import { useTranslations } from "next-intl";

interface ActiveChart {
  id: string; // productId or 'general'
  title: string;
  unit: string;
}

export default function AnalyticsClient() {
  const [activeCharts, setActiveCharts] = useState<ActiveChart[]>([
    { id: "general", title: "Genel Depo Analizi", unit: "Ürün" }
  ]);
  const [isMergedView, setIsMergedView] = useState(false);
  const t = useTranslations("Analytics");

  const addChart = (product: { id: string, name: string, unit: string }) => {
    if (!activeCharts.find(c => c.id === product.id)) {
      setActiveCharts(prev => [...prev, { id: product.id, title: product.name, unit: product.unit }]);
    }
  };

  const removeChart = (id: string) => {
    if (id === "general") return; // Keep general
    setActiveCharts(prev => prev.filter(c => c.id !== id));
  };

  const mergedProducts = activeCharts
    .filter(c => c.id !== "general")
    .map((c, idx) => ({ 
      id: c.id, 
      name: c.title, 
      color: ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"][idx % 5] 
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg">
        <div className="w-full sm:w-auto flex-1">
          <AnalyticsSearch onSelect={addChart} />
        </div>
        
        <button
          onClick={() => setIsMergedView(!isMergedView)}
          disabled={activeCharts.length < 2}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isMergedView 
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20v-6M6 20V10M18 20V4" />
          </svg>
          {t("mergeTitle")}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {isMergedView && mergedProducts.length > 0 ? (
          <MergedAnalyticsChart products={mergedProducts} />
        ) : (
          activeCharts.map((chart) => (
            <AnalyticsChartCard
              key={chart.id}
              productId={chart.id === "general" ? undefined : chart.id}
              title={chart.id === "general" ? t("warehouseGeneral") : chart.title}
              unit={chart.unit}
              onClose={chart.id !== "general" ? () => removeChart(chart.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
