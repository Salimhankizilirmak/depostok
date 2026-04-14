"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

export default function DashboardSearch() {
  const t = useTranslations("Dashboard");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState(searchParams.get("q") || "");
  const currentFilter = searchParams.get("f") || "all";

  // Debounce handle
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      // Arama değiştiğinde sayfa 1'e dön
      params.set("p", "1");
      
      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [term, pathname, replace, searchParams]);

  const handleFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    if (filter === "all") {
      params.delete("f");
    } else {
      params.set("f", filter);
    }
    params.set("p", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-lg shadow-black/20"
        />
        {isPending && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg shadow-black/20">
        <button
          onClick={() => handleFilter("all")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            currentFilter === "all"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {t("filterAll")}
        </button>
        <button
          onClick={() => handleFilter("critical")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
            currentFilter === "critical"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentFilter === "critical" ? "bg-white" : "bg-red-500"}`} />
          {t("filterCritical")}
        </button>
      </div>
    </div>
  );
}
