"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { produceItem } from "@/actions/bom";
import { toast } from "sonner";

interface ProduceModalProps {
  companyId: string;
  productId: string;
  productName: string;
  onClose: () => void;
}

export default function ProduceModal({ companyId, productId, productName, onClose }: ProduceModalProps) {
  const t = useTranslations("Dashboard");
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();

  const handleProduce = () => {
    if (quantity <= 0) return;

    startTransition(async () => {
      try {
        const result = await produceItem(companyId, productId, quantity);
        if (result.success) {
          toast.success(t("productionSuccess"));
          onClose();
        }
      } catch (err: any) {
        toast.error(err.message || t("importError"));
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v10"/><path d="M18.4 4.6a10 10 0 1 1-12.8 0"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t("produceItem")}</h2>
            <p className="text-slate-400 text-sm">{productName}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
              {t("productionQuantity")}
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all"
          >
            {t("close")}
          </button>
          <button
            onClick={handleProduce}
            disabled={isPending || quantity <= 0}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            {isPending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {t("produceItem")}
          </button>
        </div>
      </div>
    </div>
  );
}
