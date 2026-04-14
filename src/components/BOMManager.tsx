"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { saveBOM } from "@/actions/bom";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  sku: string | null;
}

interface TreeItem {
  id: string;
  parentProductId: string;
  childProductId: string;
  quantity: number;
}

interface BOMManagerProps {
  companyId: string;
  products: Product[];
  existingTrees: TreeItem[];
}

export default function BOMManager({ companyId, products, existingTrees }: BOMManagerProps) {
  const t = useTranslations("Dashboard");
  const [selectedParentId, setSelectedParentId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Seçili ana ürünün bileşenlerini filtrele
  const currentComponents = existingTrees
    .filter((t) => t.parentProductId === selectedParentId)
    .map((t) => ({ childProductId: t.childProductId, quantity: t.quantity }));

  const [localComponents, setLocalComponents] = useState<{ childProductId: string; quantity: number }[]>([]);

  // Ana ürün değiştiğinde local state'i güncelle
  const handleParentChange = (id: string) => {
    setSelectedParentId(id);
    const comps = existingTrees
      .filter((t) => t.parentProductId === id)
      .map((t) => ({ childProductId: t.childProductId, quantity: t.quantity }));
    setLocalComponents(comps);
  };

  const addComponent = () => {
    setLocalComponents([...localComponents, { childProductId: "", quantity: 1 }]);
  };

  const removeComponent = (index: number) => {
    setLocalComponents(localComponents.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: "childProductId" | "quantity", value: any) => {
    const updated = [...localComponents];
    updated[index] = { ...updated[index], [field]: value };
    setLocalComponents(updated);
  };

  const handleSave = () => {
    if (!selectedParentId) {
      toast.error("Lütfen bir ana ürün seçin.");
      return;
    }

    startTransition(async () => {
      try {
        await saveBOM(companyId, selectedParentId, localComponents.filter(c => c.childProductId && c.quantity > 0));
        toast.success(t("editSuccess"));
        router.refresh();
      } catch (err) {
        toast.error("Kaydedilirken bir hata oluştu.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol Panel: Ana Ürün Seçimi */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t("productName")} (Ana Ürün)
        </label>
        <select
          value={selectedParentId}
          onChange={(e) => handleParentChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
        >
          <option value="">Seçiniz...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.sku ? `(${p.sku})` : ""}
            </option>
          ))}
        </select>

        {selectedParentId && (
            <div className="pt-4 border-t border-slate-800">
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                    {isPending ? t("saving") : t("saveProduct")}
                </button>
            </div>
        )}
      </div>

      {/* Sağ Panel: Bileşenler */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            {t("components")}
          </h2>
          <button
            onClick={addComponent}
            disabled={!selectedParentId}
            className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          >
            + {t("addAttribute")}
          </button>
        </div>

        <div className="space-y-3">
          {localComponents.map((comp, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex-1 w-full">
                <select
                  value={comp.childProductId}
                  onChange={(e) => updateComponent(index, "childProductId", e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                >
                  <option value="">Bileşen Seçin...</option>
                  {products
                    .filter(p => p.id !== selectedParentId)
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-32">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  placeholder={t("quantity")}
                  value={comp.quantity}
                  onChange={(e) => updateComponent(index, "quantity", parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <button
                onClick={() => removeComponent(index)}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title={t("delete")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {localComponents.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl">
              <p className="text-slate-500 text-sm">Henüz bir bileşen eklenmedi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
