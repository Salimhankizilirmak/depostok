"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProduct } from "@/actions/dashboard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AttributesInput from "./AttributesInput";

interface EditProductModalProps {
  product: any;
  companyId: string;
  locationSystemEnabled: boolean;
}

export default function EditProductModal({ product, companyId, locationSystemEnabled }: EditProductModalProps) {
  const t = useTranslations("Dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      price: parseFloat(formData.get("price") as string) || 0,
      criticalThreshold: parseInt(formData.get("critical_threshold") as string) || 10,
      location: formData.get("location") as string || null,
      attributes: formData.get("attributes") as string || null,
    };

    startTransition(async () => {
      try {
        await updateProduct(product.id, companyId, data);
        toast.success(t("editSuccess"));
        setIsOpen(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || t("deleteError"));
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
        title={t("edit")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t("editProduct")}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("productName")}</label>
                  <input name="name" type="text" defaultValue={product.name} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("sku")}</label>
                  <input name="sku" type="text" defaultValue={product.sku} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("unitPrice")}</label>
                  <input name="price" type="number" step="0.01" defaultValue={product.price} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("criticalLevel")}</label>
                  <input name="critical_threshold" type="number" defaultValue={product.criticalThreshold} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                </div>

                {locationSystemEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{t("shelfLocation")}</label>
                    <input name="location" type="text" defaultValue={product.location} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" />
                  </div>
                )}
              </div>

              <AttributesInput initialValue={product.attributes} />

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-semibold"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {isPending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {t("saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
