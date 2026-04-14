"use client";

import { useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importProducts, undoImportProducts } from "@/actions/dashboard";
import { useRouter } from "next/navigation";

interface ImportExcelButtonProps {
  companyId: string;
}

export default function ImportExcelButton({ companyId }: ImportExcelButtonProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fuzzy Matching kelime grupları
  const schemaMap = {
    name: ["ad", "isim", "urunadi", "name", "title", "malzeme"],
    sku: ["sku", "barkod", "kod", "code", "itemno"],
    currentStock: ["stok", "adet", "miktar", "stock", "qty", "quantity"],
    price: ["fiyat", "price", "maliyet", "tutar"],
    criticalThreshold: ["kritik", "min", "limit"],
    location: ["raf", "konum", "yer", "location", "depo"],
  };

  const cleanHeader = (h: string) => h.toString().toLowerCase().replace(/\s+/g, "");

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

      processImport(data);
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

      // Sütun eşleştirme
      const matchedKeys = new Set<string>();
      Object.entries(schemaMap).forEach(([field, aliases]) => {
        const foundKey = keys.find((k) => 
          aliases.some(alias => cleanHeader(k).includes(alias))
        );
        if (foundKey) {
          cleanRow[field] = row[foundKey];
          matchedKeys.add(foundKey);
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

  const downloadTemplate = () => {
    const headers = [["Ürün Adı", "SKU", "Stok", "Birim Fiyat", "Kritik Eşik", "Raf Konumu"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Leadnova_Urun_Sablonu.xlsx");
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
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-all border border-slate-700 shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isPending ? t("importing") : t("importExcel")}
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
