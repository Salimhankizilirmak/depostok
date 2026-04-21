"use client";

import { useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importBOM } from "@/actions/bom";
import { useRouter } from "next/navigation";

interface BOMImportExcelButtonProps {
  companyId: string;
}

export default function BOMImportExcelButton({ companyId }: BOMImportExcelButtonProps) {
  const t = useTranslations("Dashboard");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      processBOMImport(jsonData);
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processBOMImport = (rawData: any[]) => {
    const bomRows: any[] = [];

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
    const headers = [["Ana_SKU", "Bilesen_SKU", "Miktar"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Leadnova_BOM_Sablonu.xlsx");
  };

  return (
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
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {isPending ? t("importing") : t("productTree") + " " + t("importExcel")}
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
