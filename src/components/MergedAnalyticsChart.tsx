"use client";

import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { getWarehouseAnalysisData } from "@/actions/analytics";
import { useTranslations } from "next-intl";

interface MergedDataPoint {
  month: string;
  [key: string]: string | number;
}

interface Product {
  id: string;
  name: string;
  color: string;
}

interface MergedAnalyticsChartProps {
  products: Product[];
}

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function MergedAnalyticsChart({ products }: MergedAnalyticsChartProps) {
  const [data, setData] = useState<MergedDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("Analytics");

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const months: string[] = [];
        for (let i = 0; i < 12; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - (11 - i));
          months.push(d.toISOString().split('T')[0].substring(0, 7));
        }

        const allResults = await Promise.all(
          products.map(async (p) => {
            const res = await getWarehouseAnalysisData(p.id);
            return { id: p.id, name: p.name, data: res };
          })
        );

        const merged = months.map(m => {
          const point: MergedDataPoint = { month: m };
          allResults.forEach(res => {
            const monthVal = res.data.find(d => d.month === m);
            // Toplam piyasa değerini gösterelim (Giriş - Çıkış farkı veya sadece Giriş?)
            // Kullanıcı "TL/Fiyat verilerini" birleştir demiş. Giriş fiyatlarını (stok girişi değeri) kullanalım.
            point[res.id] = monthVal ? monthVal.inPrice : 0;
          });
          return point;
        });

        setData(merged);
      } catch (err) {
        console.error("Failed to fetch merged data", err);
      } finally {
        setLoading(false);
      }
    };

    if (products.length > 0) fetchAllData();
  }, [products]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl shadow-black/20">
      <div className="mb-8 text-center sm:text-left">
        <h3 className="text-white font-bold text-xl">{t("comparison")}</h3>
        <p className="text-slate-500 text-sm">Ürünlerin Aylık Giriş Değerleri Karşılaştırması</p>
      </div>

      <div className="h-[400px] w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => {
                  const m = val.split("-")[1];
                  return m || val;
                }}
              />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b" }}
                itemStyle={{ fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ paddingTop: 30 }} />
              {products.map((p, idx) => (
                <Line 
                  key={p.id} 
                  type="monotone" 
                  dataKey={p.id} 
                  name={p.name} 
                  stroke={p.color || COLORS[idx % COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2, fill: "#0f172a" }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
