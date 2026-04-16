"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { bindIdentitySA } from "@/actions/auth";

export default function IdentityBinder() {
  const { user, isLoaded } = useUser();
  const t = useTranslations("Settings");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isLoaded || !user) return null;

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t("fillAllFields"));
      return;
    }
    setError("");
    setSuccess(false);

    startTransition(async () => {
      const result = await bindIdentitySA(username, password);
      
      if (result?.success) {
        setSuccess(true);
        setUsername("");
        setPassword("");
      } else {
        setError(result?.error || t("updateFailed"));
      }
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl shadow-black/20 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t("loginPreferences")}</h2>
          <p className="text-slate-400 text-sm">{t("loginPreferencesDesc")}</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            <strong>Önemli:</strong> Clerk varsayılan olarak en az 8 karakter şifre ister. Eğer "123" gibi kısa şifreler kullanmak istiyorsanız, Clerk panelinizden şifre politikasını (Authentication &gt; Password) değiştirmeniz gerekir.
          </p>
        </div>
      </div>

      <form onSubmit={handleBind} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("setUsername")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isPending}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-all font-mono"
            placeholder="admin123"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">{t("setPassword")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-all font-mono"
            placeholder="******"
          />
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        {success && <p className="text-emerald-400 text-xs mt-2">{t("updateSuccess")}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 mt-4 shadow-lg shadow-indigo-500/20"
        >
          {isPending ? t("saving") : t("save")}
        </button>
      </form>
    </div>
  );
}
