"use client";

import { useTransition, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importProducts, undoImportProducts } from "@/actions/dashboard";
import { useRouter } from "next/navigation";

interface ImportExcelButtonProps {
  companyId: string;
}

const requiredFields = [
  { id: "name", label: "Ürün Adı", aliases: ["ad", "isim", "urun", "name", "title", "malzeme"], required: true },
  { id: "sku", label: "Stok Kodu (SKU)", aliases: ["sku", "barkod", "kod", "code", "itemno"], required: false },
  { id: "currentStock", label: "Miktar", aliases: ["stok", "adet", "miktar", "stock", "qty", "quantity"], required: false },
  { id: "price", label: "Fiyat", aliases: ["fiyat", "price", "maliyet", "tutar"], required: false },
  { id: "criticalThreshold", label: "Kritik Eşik", aliases: ["kritik", "min", "limit"], required: false },
  { id: "unit", label: "Birim", aliases: ["birim", "unit", "olcu"], required: false },
  { id: "location", label: "Raf Konumu", aliases: ["raf", "konum", "yer", "location", "lokasyon"], required: false }
];

export default function ImportExcelButton({ companyId }: ImportExcelButtonProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [wizardData, setWizardData] = useState<{ headers: string[], rawData: any[] } | null>(null);
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});

  const normalize = (h: string) => h.toString().toLowerCase().trim().replace(/[^a-z0-9ğüşıöç]/g, "");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const jsonData = XLSX.utils.sheet_to_json(ws, { blankrows: false });

      if (jsonData.length === 0) {
        toast.error(t("importNoData"));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const rawHeaders = (XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[]) || [];
      const headers = rawHeaders.filter(h => h && !h.toString().startsWith("__EMPTY"));

      const fallbackHeaders = Object.keys(jsonData[0] || {}).filter(h => !h.startsWith("__EMPTY"));
      const finalHeaders = headers.length > 0 ? headers : fallbackHeaders;

      const initialMap: Record<string, string> = {};
      requiredFields.forEach(field => {
        const match = finalHeaders.find(h => {
          const clean = normalize(h);
          return field.aliases.some(alias => clean.includes(alias));
        });
        if (match) initialMap[field.id] = match.toString();
      });

      setMapping(initialMap);
      setWizardData({ headers: finalHeaders, rawData: jsonData });

      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProcessMappedData = () => {
    if (!wizardData) return;

    let importedProducts: any[] = [];
    wizardData.rawData.forEach((row: any) => {
      const cleanRow: any = {};
      const mappedExcelCols = new Set<string>(Object.values(mapping));

      Object.entries(mapping).forEach(([sysField, excelCol]) => {
        if (excelCol && row[excelCol] !== undefined) {
          cleanRow[sysField] = row[excelCol];
        }
      });

      const extraAttributes: Record<string, any> = {};
      Object.keys(row).forEach(k => {
        if (!mappedExcelCols.has(k) && !k.toString().startsWith("__EMPTY")) {
          extraAttributes[k] = row[k];
        }
      });
      cleanRow.attributes = Object.keys(extraAttributes).length > 0 ? extraAttributes : null;

      if (!cleanRow.name) return;

      cleanRow.currentStock = parseInt(cleanRow.currentStock as any) || 0;
      cleanRow.criticalThreshold = parseInt(cleanRow.criticalThreshold as any) || 10;

      if (cleanRow.price) {
        let p = cleanRow.price.toString()
          .replace(/[^\d,.-]/g, "")
          .replace(",", ".");
        cleanRow.price = parseFloat(p) || 0;
      } else {
        cleanRow.price = 0;
      }

      importedProducts.push(cleanRow);
    });

    setWizardData(null);

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
    const headers = [["Ürün Adı", "SKU", "Stok", "Birim Fiyat", "Kritik Eşik", "Birim", "Raf Konumu"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Leadnova_Urun_Sablonu.xlsx");
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx, .xls, .csv, .xlsb, application/vnd.ms-excel.sheet.binary.macroEnabled.12"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          title={t("supportedFormats")}
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

      {wizardData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-1">
              <h3 className="text-xl font-bold text-slate-800">{t("matchColumns")}</h3>
              <p className="text-sm text-slate-500">Excel dosyasındaki başlıkları sistemdeki alanlarla eşleştirin.</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm font-semibold text-slate-500 px-2">
                <span>{t("systemField")}</span>
                <span className="hidden sm:block">{t("excelColumn")}</span>
              </div>
              <div className="space-y-3">
                {requiredFields.map(field => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-700 text-sm">
                      {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    <select
                      value={mapping[field.id] || ""}
                      onChange={(e) => setMapping(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="w-full text-sm rounded-lg border-slate-200 bg-white shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 outline-none h-10 px-3"
                    >
                      <option value="">{t("selectColumn")}</option>
                      {wizardData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setWizardData(null)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleProcessMappedData}
                disabled={!mapping.name}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {t("completeAndUpload")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
