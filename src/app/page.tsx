import Link from "next/link";
import InstallPWA from "@/components/InstallPWA";

export default function Home() {
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
          <InstallPWA />
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Firma Girişi
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-800 text-[10px] md:text-xs font-medium text-slate-400 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          YENİ: Çoklu Kullanıcı Desteği Yayında
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-[1.1]">
          Şirket içi stok çözümleri{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-500">
            Leadnova
          </span>{" "}
          ile daha kolay
        </h1>

        <p className="text-slate-400 text-base md:text-xl max-w-2xl mb-12 leading-relaxed">
          Deponuzu akıllı, güvenli ve çok kullanıcılı sistemimizle anında yönetmeye başlayın. 
          Stok hareketlerini takip edin, kritik seviyeleri izleyin.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto group relative px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-white/10"
          >
            Sisteme Giriş Yap
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
            Teknik Destek
          </a>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 border border-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
          >
            Super Admin
          </Link>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-24 relative max-w-5xl w-full">
          <div className="absolute inset-0 bg-violet-500/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl shadow-black">
             <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/50 aspect-video flex flex-col">
                <div className="h-10 border-b border-slate-800/50 flex items-center px-4 gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500/50" />
                   <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                   <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 p-8 grid grid-cols-3 gap-6 opacity-40 grayscale">
                   <div className="h-24 bg-slate-900 rounded-xl" />
                   <div className="h-24 bg-slate-900 rounded-xl" />
                   <div className="h-24 bg-slate-900 rounded-xl" />
                   <div className="col-span-3 h-48 bg-slate-900 rounded-xl" />
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © 2026 Leadnova Tech. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-8 text-slate-500 text-sm">
            <span className="hover:text-white cursor-pointer">Gizlilik</span>
            <span className="hover:text-white cursor-pointer">Şartlar</span>
            <span className="hover:text-white cursor-pointer">İletişim</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
