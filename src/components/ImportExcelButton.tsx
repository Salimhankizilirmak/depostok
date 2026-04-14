"use client";

import { useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importProducts, undoImportProducts } from "@/actions/dashboard";
import { importBOM } from "@/actions/bom";
import { useRouter } from "next/navigation";

interface ImportExcelButtonProps {
  companyId: string;
}

export default function ImportExcelButton({ companyId }: ImportExcelButtonProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"product" | "bom">("product");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fuzzy Matching kelime grupları
  const schemaMap = {
    name: ["ad", "isim", "urun", "name", "title", "malzeme"],
    sku: ["sku", "barkod", "kod", "code", "itemno"],
    currentStock: ["stok", "adet", "miktar", "stock", "qty", "quantity"],
    price: ["fiyat", "price", "maliyet", "tutar"],
    criticalThreshold: ["kritik", "min", "limit"],
    location: ["raf", "konum", "yer", "location", "lokasyon"],
  };

  const normalize = (h: string) => h.toString().toLowerCase().trim().replace(/[^a-z0-9ğüşıöç]/g, "");

  const findBestMatch = (header: string) => {
    const clean = normalize(header);
    
    // 1. Önce Stok (Miktar) kelimesini ara (Keyword Collision önceliği)
    if (schemaMap.currentStock.some(alias => clean.includes(alias))) return "currentStock";
    
    // 2. Diğerlerini tara
    for (const [field, aliases] of Object.entries(schemaMap)) {
      if (field === "currentStock") continue;
      if (aliases.some(alias => clean.includes(alias))) return field;
    }
    
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (mode === "product") {
        processImport(data);
      } else {
        processBOMImport(data);
      }
    };
    reader.readAsBinaryString(file);
    
    // Inputu temizle ki aynı dosya tekrar seçilebilsin
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processImport = (rawData: any[]) => {
    let importedProducts: any[] = [];
    let skippedCount = 0;
    let totalRead = rawData.length;

    rawData.forEach((row) => {
      const cleanRow: any = {};
      const keys = Object.keys(row);
      const matchedKeys = new Set<string>();

      // Akıllı Eşleştirme
      keys.forEach((key) => {
        const field = findBestMatch(key);
        if (field && !cleanRow[field]) {
          cleanRow[field] = row[key];
          matchedKeys.add(key);
        }
      });

      // Ek özellikleri (Attributes) topla
      const extraAttributes: Record<string, any> = {};
      keys.forEach((k) => {
        if (!matchedKeys.has(k)) {
          extraAttributes[k] = row[k];
        }
      });
      cleanRow.attributes = Object.keys(extraAttributes).length > 0 ? extraAttributes : null;

      // Veri Temizliği & Fallback
      if (!cleanRow.name || !cleanRow.sku) {
        skippedCount++;
        return;
      }

      // Stok
      cleanRow.currentStock = parseInt(cleanRow.currentStock) || 0;
      
      // Kritik Stok
      cleanRow.criticalThreshold = parseInt(cleanRow.criticalThreshold) || 10;

      // Fiyat Temizliği (150,50 TL -> 150.50)
      if (cleanRow.price) {
        let p = cleanRow.price.toString()
          .replace(/[^\d,.-]/g, "") // Sadece rakam, virgül, nokta, eksi
          .replace(",", "."); // Virgülü noktaya çevir
        cleanRow.price = parseFloat(p) || 0;
      } else {
        cleanRow.price = 0;
      }

      importedProducts.push(cleanRow);
    });

    if (importedProducts.length === 0) {
      toast.error(t("importNoData"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await importProducts(companyId, importedProducts);
        
        if (result?.success && result.batchId) {
          toast.success(t("importSuccessWithUndo", { count: importedProducts.length }), {
            duration: 10000,
            action: {
              label: t("undoAction"),
              onClick: async () => {
                try {
                  await undoImportProducts(result.batchId, companyId);
                  toast.success(t("undoSuccess"));
                } catch (err) {
                  toast.error(t("undoError"));
                }
              }
            }
          });
        }

        router.refresh();
      } catch (error) {
        toast.error(t("importError"));
        console.error(error);
      }
    });
  };

  const processBOMImport = (rawData: any[]) => {
    const bomRows: any[] = [];
    
    // Basit eşleştirme: Başlıklarda ana/parent ve bilesen/component ve miktar/qty ara
    rawData.forEach(row => {
        const keys = Object.keys(row);
        let parentSku = "";
        let componentSku = "";
        let quantity = 0;

        keys.forEach(k => {
            const clean = normalize(k);
            if (clean.includes("ana") || clean.includes("parent")) parentSku = row[k];
            if (clean.includes("bilesen") || clean.includes("component")) componentSku = row[k];
            if (clean.includes("miktar") || clean.includes("qty") || clean.includes("quantity")) quantity = parseFloat(row[k]);
        });

        if (parentSku && componentSku && quantity > 0) {
            bomRows.push({ parentSku, componentSku, quantity });
        }
    });

    if (bomRows.length === 0) {
        toast.error(t("importNoData"));
        return;
    }

    startTransition(async () => {
        try {
            const result = await importBOM(companyId, bomRows);
            if (result.success) {
                toast.success(t("bomImportSuccess"));
                router.refresh();
            }
        } catch (err) {
            toast.error(t("importError"));
        }
    });
  };

  const downloadTemplate = () => {
    let headers: string[][];
    let filename: string;
    
    if (mode === "product") {
      headers = [["Ürün Adı", "SKU", "Stok", "Birim Fiyat", "Kritik Eşik", "Raf Konumu"]];
      filename = "Leadnova_Urun_Sablonu.xlsx";
    } else {
      headers = [["Ana_SKU", "Bilesen_SKU", "Miktar"]];
      filename = "Leadnova_BOM_Sablonu.xlsx";
    }

    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      
      <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setMode("product")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "product" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
        >
          {t("products")}
        </button>
        <button
          onClick={() => setMode("bom")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "bom" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
        >
          {t("bom")}
        </button>
      </div>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-all border border-slate-700 shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isPending ? t("importing") : (mode === "product" ? t("importExcel") : t("productTree") + " " + t("importExcel"))}
      </button>

      <button
        onClick={downloadTemplate}
        title={t("downloadTemplate")}
        className="w-full sm:w-auto h-[42px] px-4 flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-all active:scale-[0.98]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}
