import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden text-white">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[400px] flex flex-col items-center gap-8">
        {/* Logo Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tighter">LEADNOVA</span>
        </div>

        <SignUp 
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-slate-900 border border-slate-800 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden",
              headerTitle: "text-white font-bold text-xl",
              headerSubtitle: "text-slate-400 text-sm",
              socialButtonsBlockButton: "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white transition-all rounded-xl py-2.5",
              socialButtonsBlockButtonText: "font-semibold text-xs",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500 text-[10px] font-bold",
              formFieldLabel: "text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1.5",
              formFieldInput: "bg-slate-950 border-slate-800 text-white rounded-xl py-3 focus:border-violet-500/50 transition-all text-sm",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl py-3 transition-all shadow-lg shadow-violet-500/10 active:scale-[0.98] text-sm",
              footerActionText: "text-slate-500 text-xs",
              footerActionLink: "text-violet-400 hover:text-violet-300 font-bold text-xs",
              formResendCodeLink: "text-violet-400 hover:text-violet-300",
              identityPreviewText: "text-white font-medium",
              identityPreviewEditButtonIcon: "text-violet-400",
            }
          }}
        />
        
        <div className="w-full text-center">
          <p className="text-[10px] font-bold text-slate-500 bg-slate-900/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-slate-800/50 inline-block uppercase tracking-widest">
             Yeni Bir Firma Kaydı Oluşturun
          </p>
        </div>
      </div>
    </div>
  );
}
