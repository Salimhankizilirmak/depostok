"use client";

import * as XLSX from "xlsx";

interface ExportExcelButtonProps {
  data: Record<string, unknown>[];
  fileName: string;
}

export default function ExportExcelButton({
  data,
  fileName,
}: ExportExcelButtonProps) {
  const handleExport = () => {
    // Veriyi Excel formatına dönüştür
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Sütun genişliklerini içeriğe göre ayarla
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      let maxLength = key.length;
      data.forEach((row) => {
        const val = row[key];
        const valLength = val ? String(val).length : 0;
        if (valLength > maxLength) maxLength = valLength;
      });
      return { wch: maxLength + 2 }; // Biraz padding ekle
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rapor");

    // Dosyayı indir
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl px-4 py-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      Excel Raporu Al
    </button>
  );
}
