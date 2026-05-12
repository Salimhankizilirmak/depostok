"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Attribute {
  id: string;
  name: string;
  value: string;
}

interface AttributesInputProps {
  initialValue?: string; // JSON string
}

export default function AttributesInput({ initialValue }: AttributesInputProps) {
  const t = useTranslations("Dashboard");
  const [attributes, setAttributes] = useState<Attribute[]>(() => {
    if (initialValue) {
      try {
        const parsed = JSON.parse(initialValue);
        return Object.entries(parsed).map(([name, value]) => ({
          id: crypto.randomUUID(),
          name,
          value: String(value)
        }));
      } catch (e) {
        console.error("Failed to parse initial attributes", e);
      }
    }
    return [];
  });

  const attrObj: Record<string, string> = {};
  attributes.forEach(attr => {
    if (attr.name.trim()) {
      attrObj[attr.name.trim()] = attr.value.trim();
    }
  });
  const jsonValue = Object.keys(attrObj).length > 0 ? JSON.stringify(attrObj) : "";

  const addAttribute = () => {
    setAttributes([...attributes, { id: crypto.randomUUID(), name: "", value: "" }]);
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter(a => a.id !== id));
  };

  const updateAttribute = (id: string, field: "name" | "value", val: string) => {
    setAttributes(attributes.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {t("additionalAttributes")}
        </label>
        <button
          type="button"
          onClick={addAttribute}
          className="text-[10px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 py-1 rounded-md transition-all flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("addAttribute")}
        </button>
      </div>

      <div className="space-y-2">
        {attributes.map((attr) => (
          <div key={attr.id} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              placeholder={t("attributeName")}
              value={attr.name}
              onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            <input
              type="text"
              placeholder={t("attributeValue")}
              value={attr.value}
              onChange={(e) => updateAttribute(attr.id, "value", e.target.value)}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => removeAttribute(attr.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {attributes.length === 0 && (
          <p className="text-[10px] text-slate-600 italic">
            {t("noAttributes")}
          </p>
        )}
      </div>

      <input type="hidden" name="attributes" value={jsonValue} />
    </div>
  );
}
