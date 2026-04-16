"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteProduct } from "@/actions/dashboard";
import { toast } from "sonner";

interface DeleteProductButtonProps {
  productId: string;
  companyId: string;
}

export default function DeleteProductButton({ productId, companyId }: DeleteProductButtonProps) {
  const t = useTranslations("Dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProduct(productId, companyId);
        toast.success(t("deleteSuccess") || "Ürün başarıyla silindi.");
        setIsOpen(false);
      } catch (_error) {
        toast.error(t("deleteError"));
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
        title={t("delete")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
        </svg>
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPending && setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{t("confirmDeleteTitle")}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              {t("confirmDeleteDesc")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={isPending}
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isPending ? "..." : t("delete")}
              </button>
              <button
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-all border border-slate-700 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
