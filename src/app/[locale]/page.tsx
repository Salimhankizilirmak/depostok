"use client";

import Link from "next/link";
import InstallPWA from "@/components/InstallPWA";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("Hero");
  const navT = useTranslations("Navbar");

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-violet-500/30 overflow-hidden relative">
      {/* Arka Plan Efektleri (Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Leadnova</span>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <InstallPWA />
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            {navT("login")}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-[10px] md:text-xs font-medium text-slate-400 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          {t("badge")}
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-[1.1]">
          {t("title").includes("Leadnova") ? (
            <>
              {t("title").split("Leadnova")[0]}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-500">
                Leadnova
              </span>
              {t("title").split("Leadnova")[1]}
            </>
          ) : (
            t("title")
          )}
        </h1>

        <p className="text-slate-400 text-base md:text-xl max-w-2xl mb-12 leading-relaxed">
          {t("description")}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto group relative px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/10"
          >
            {t("cta")}
          </Link>
          <a
            href="https://wa.me/905374064175"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/10 text-slate-400 font-bold rounded-2xl hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {navT("support")}
          </a>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 border border-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
          >
            {navT("admin")}
          </Link>
        </div>

        {/* Novexis Tech Showcase / Hero Preview */}
        <div className="mt-24 relative max-w-6xl w-full group">
          {/* Animated Glow Backdrops */}
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-violet-600/30 blur-[120px] rounded-full pointer-events-none group-hover:bg-violet-600/40 transition-colors duration-700" />
          <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none group-hover:bg-emerald-600/30 transition-colors duration-700" />

          {/* Premium Browser Frame */}
          <div className="relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-3 shadow-2xl shadow-black/80 backdrop-blur-md overflow-hidden transform transition-all duration-700 hover:scale-[1.01] hover:shadow-violet-500/10 active:scale-[0.995]">
            <div className="bg-slate-950/90 rounded-[1.8rem] overflow-hidden border border-slate-800/80 flex flex-col aspect-[16/10] sm:aspect-video relative group/browser">
              
              {/* Browser Header */}
              <div className="h-12 border-b border-white/5 bg-slate-900/50 flex items-center px-6 gap-3 relative z-20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-950/50 border border-white/5 px-4 py-1 rounded-lg flex items-center gap-2 max-w-[280px] w-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="text-[10px] text-slate-500 truncate font-medium tracking-wide">stok.novexistech.com</span>
                  </div>
                </div>
                <div className="w-16" /> {/* Spacer */}
              </div>

              {/* Website Content (Screenshot) */}
              <div className="flex-1 bg-slate-950 relative overflow-hidden group-hover/browser:cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/5 to-transparent pointer-events-none z-10" />
                
                {/* Image Wrapper with Parallax Hover Effect */}
                <div className="w-full h-full relative transition-transform duration-1000 group-hover/browser:scale-105">
                  <img 
                    src="/images/novexistech.png" 
                    alt="Novexis Tech Showcase" 
                    className="w-full h-full object-cover object-top opacity-90 group-hover/browser:opacity-100 transition-opacity duration-700"
                  />
                </div>

                {/* Glass Overlay on Hover */}
                <div className="absolute inset-0 bg-slate-950/0 group-hover/browser:bg-slate-950/10 transition-colors duration-500 z-20" />
                
                {/* Tech Badges Over Image */}
                <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 z-30">
                  {["Yazılım", "Otomasyon", "Yapay Zeka"].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-full text-[10px] font-bold text-white/70 tracking-widest uppercase">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtle Gradient Border Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-emerald-500/20 rounded-[2.6rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          </div>

          {/* Decorative Floating Elements */}
          <div className="absolute -right-6 top-1/4 w-32 h-32 bg-indigo-500/20 border border-white/5 backdrop-blur-2xl rounded-3xl -rotate-12 -z-10 animate-pulse" />
          <div className="absolute -left-12 bottom-1/4 w-40 h-40 bg-violet-600/10 border border-white/5 backdrop-blur-3xl rounded-full -z-10" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © 2026 Leadnova Tech. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-slate-500 text-sm">
            <span className="hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-white cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
