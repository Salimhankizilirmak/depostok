"use client";

import { SignOutButton } from "@clerk/nextjs";

export default function UnauthorizedUI({ email, accessDeniedText, noCompanyFoundText }: { 
  email: string | null; 
  accessDeniedText: string; 
  noCompanyFoundText: string;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/50 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">{accessDeniedText}</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {noCompanyFoundText}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
             onClick={() => window.location.href = '/'}
             className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-[0.98]"
          >
            Baştan Başlayın (Ana Sayfa)
          </button>
          
          <SignOutButton>
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-[0.98]">
               Oturumu Kapat ve Farklı Hesapla Gir
            </button>
          </SignOutButton>
        </div>

        {email && (
          <p className="mt-8 inline-flex items-center gap-2 text-[10px] text-slate-500 bg-slate-950/50 border border-slate-800 rounded-full px-4 py-1.5 uppercase tracking-wider font-bold">
            <span className="w-1 h-1 rounded-full bg-slate-600 animate-pulse" />
            {email}
          </p>
        )}
      </div>
    </div>
  );
}
