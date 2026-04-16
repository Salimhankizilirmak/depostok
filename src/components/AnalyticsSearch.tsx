"use client";

import { useState, useEffect } from "react";
import { getProductsForSearch } from "@/actions/analytics";
import { useTranslations } from "next-intl";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  price: number;
}

interface AnalyticsSearchProps {
  onSelect: (product: Product) => void;
}

export default function AnalyticsSearch({ onSelect }: AnalyticsSearchProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const t = useTranslations("Analytics");

  const filtered = query.length > 1 
    ? products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.sku?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const isOpen = isFocused && query.length > 1 && filtered.length > 0;
  useEffect(() => {
    const fetchProducts = async () => {
      const data = await getProductsForSearch();
      setProducts(data);
    };
    fetchProducts();
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto mb-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-2xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 sm:text-sm transition-all"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay for click selection
        />
      </div>

      {isOpen && (
        <div className="absolute mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
          {filtered.map((product) => (
            <button
              key={product.id}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between border-b border-slate-800 last:border-0 transition-colors"
              onClick={() => {
                onSelect(product);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku || "No SKU"}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                  {product.unit}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
