"use client";

import { useState, useTransition } from "react";
import { updateStock } from "@/app/dashboard/actions";

interface StockButtonsProps {
  productId: string;
  companyId: string;
  productName: string;
}

export default function StockButtons({
  productId,
  companyId,
  productName,
}: StockButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ type: "in" | "out" } | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function openModal(type: "in" | "out") {
    setQuantity("1");
    setDescription("");
    setError("");
    setModal({ type });
  }

  function closeModal() {
    setModal(null);
    setError("");
  }

  function handleSubmit() {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      setError("Geçerli bir miktar girin.");
      return;
    }
    if (!description.trim()) {
      setError("Açıklama zorunludur.");
      return;
    }
    startTransition(async () => {
      await updateStock(productId, companyId, modal!.type, qty, description.trim());
      closeModal();
    });
  }

  return (
    <>
      {/* Butonlar */}
      <div className="flex items-center justify-end gap-2">
        {/* Stok Giriş */}
        <button
          onClick={() => openModal("in")}
          disabled={isPending}
          title="Stok Girişi"
          className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Giriş
        </button>

        {/* Stok Çıkış */}
        <button
          onClick={() => openModal("out")}
          disabled={isPending}
          title="Stok Çıkışı"
          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Çıkış
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/60">
            {/* Başlık */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  modal.type === "in"
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-red-500/20 border border-red-500/30"
                }`}
              >
                {modal.type === "in" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">
                  {modal.type === "in" ? "Stok Girişi" : "Stok Çıkışı"}
                </h3>
                <p className="text-slate-500 text-xs truncate max-w-[180px]">{productName}</p>
              </div>
              <button
                onClick={closeModal}
                className="ml-auto text-slate-500 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Input */}
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Miktar (adet)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setError(""); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all tabular-nums mb-4"
            />

            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              İşlem Açıklaması
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(""); }}
              placeholder="Örn: Müşteri satışı, Yeni sevkiyat..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all min-h-[80px] resize-none"
            />
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}

            {/* Butonlar */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl py-2.5 transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className={`flex-1 text-white text-sm font-semibold rounded-xl py-2.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  modal.type === "in"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25"
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/25"
                }`}
              >
                {isPending ? "Kaydediliyor…" : modal.type === "in" ? "Giriş Yap" : "Çıkış Yap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
