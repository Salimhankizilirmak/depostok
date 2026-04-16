"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Product {
  id: string;
  name: string;
  sku: string | null;
}

interface HistoryFiltersProps {
  products: Product[];
}

export default function HistoryFilters({ products }: HistoryFiltersProps) {
  const t = useTranslations("History");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [selectedTypes, setSelectedTypes] = useState(searchParams.get("type") || "all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    searchParams.get("productIds")?.split(",").filter(Boolean) || []
  );

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (dateFrom) params.set("dateFrom", dateFrom); else params.delete("dateFrom");
    if (dateTo) params.set("dateTo", dateTo); else params.delete("dateTo");
    if (selectedTypes !== "all") params.set("type", selectedTypes); else params.delete("type");
    if (selectedProductIds.length > 0) params.set("productIds", selectedProductIds.join(",")); else params.delete("productIds");
    
    router.push(`?${params.toString()}`);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedTypes("all");
    setSelectedProductIds([]);
    router.push("?");
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8 backdrop-blur-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarih Aralığı */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            {t("dateRange")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-all cursor-pointer"
            />
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* İşlem Tipi */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            {t("movementType")}
          </label>
          <select 
            value={selectedTypes}
            onChange={(e) => setSelectedTypes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500 transition-all cursor-pointer appearance-none"
          >
            <option value="all">{t("allTypes")}</option>
            <option value="in">{t("in")}</option>
            <option value="out">{t("out")}</option>
            <option value="production">{t("production")}</option>
          </select>
        </div>

        {/* Ürün Seçimi (Multi-select list) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
            {t("selectProducts")}
          </label>
          <div className="relative group">
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 min-h-[38px] cursor-pointer flex flex-wrap gap-1">
              {selectedProductIds.length === 0 ? t("filterAll") : (
                selectedProductIds.map(id => {
                  const p = products.find(prod => prod.id === id);
                  return (
                    <span key={id} className="bg-violet-600/20 text-violet-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-violet-500/20">
                      {p?.sku || p?.name.substring(0, 8)}
                      <button onClick={(e) => { e.stopPropagation(); toggleProduct(id); }} className="hover:text-white">&times;</button>
                    </span>
                  );
                })
              )}
            </div>
            
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[200px] overflow-y-auto hidden group-hover:block hover:block p-2 scrollbar-thin scrollbar-thumb-slate-700">
              {products.map(p => (
                <div 
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                    selectedProductIds.includes(p.id) ? "bg-violet-600/20 text-white" : "hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold">{p.name}</span>
                    <span className="text-[9px] text-slate-500">{p.sku}</span>
                  </div>
                  {selectedProductIds.includes(p.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex items-end gap-2">
          <button 
            onClick={handleFilter}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            {t("filter")}
          </button>
          <button 
            onClick={resetFilters}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-[0.98]"
          >
            {t("reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
