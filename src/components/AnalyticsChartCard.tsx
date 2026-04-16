"use client";

import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { getWarehouseAnalysisData } from "@/actions/analytics";
import { useTranslations } from "next-intl";

interface AnalysisData {
  month: string;
  inQty: number;
  outQty: number;
  inPrice: number;
  outPrice: number;
  unit: string;
}

interface AnalyticsChartCardProps {
  productId?: string;
  title: string;
  unit?: string;
  onClose?: () => void;
}

export default function AnalyticsChartCard({ productId, title, unit: initialUnit = "Adet", onClose }: AnalyticsChartCardProps) {
  const [data, setData] = useState<AnalysisData[]>([]);
  const [mode, setMode] = useState<"qty" | "price">("qty");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Analytics");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getWarehouseAnalysisData(productId);
        setData(result);
      } catch (err) {
        console.error("Failed to fetch analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-slate-400 text-xs mb-2 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-semibold text-white">
                {entry.name}: {entry.value.toLocaleString()} {mode === "qty" ? (data[0]?.unit || initialUnit) : "TL"}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl shadow-black/20 group relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <p className="text-slate-500 text-xs">Son 12 Ayın Performansı</p>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMode("qty")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "qty" ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("unitLabel")} {data[0]?.unit || initialUnit}
          </button>
          <button
            onClick={() => setMode("price")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === "price" ? "bg-violet-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("price")}
          </button>
        </div>
      </div>

      <div className="h-[300px] w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {mode === "qty" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => {
                    const m = val.split("-")[1];
                    return m || val;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Bar name={t("monthlyIn")} dataKey="inQty" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name={t("monthlyOut")} dataKey="outQty" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => {
                    const m = val.split("-")[1];
                    return m || val;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                <Area name={t("monthlyIn")} type="monotone" dataKey="inPrice" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area name={t("monthlyOut")} type="monotone" dataKey="outPrice" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
            </svg>
            <p className="text-sm">{t("noData")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
