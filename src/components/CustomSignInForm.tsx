"use client";

import { useSignIn, useClerk } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CustomSignInForm() {
  const { signIn: reactiveSignIn } = useSignIn();
  const { setActive, loaded: isLoaded, client } = useClerk();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den hata mesajı kontrolü (SSO hatası vb.)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError("Giriş başarısız oldu. Lütfen yetkili bir hesapla tekrar deneyin.");
    }
  }, [searchParams]);

  if (!isLoaded || !reactiveSignIn) {
    return (
      <div className="flex justify-center my-8">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Kullanıcı adı ve şifre zorunludur.");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      // Backend client üzerinden işlem yapıyoruz (Tip hatalarını önlemek için)
      const result = await client.signIn.create({
        identifier: username,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Giriş adımları tamamlanamadı. Lütfen yöneticinizle görüşün.");
      }
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      const error = err as { errors?: { message: string }[] };
      setError(error.errors?.[0]?.message || "Doğrulama başarısız.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: any) {
      console.error(err);
      setError("Google ile giriş başlatılırken bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50">
      
      {/* Kullanıcı Adı ve Şifre Alanı */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Giriş Yap</h2>
        <p className="text-sm font-medium text-slate-400">
          Sisteme size verilen <strong className="text-white">Kullanıcı Adı</strong> ve <strong className="text-white">Şifre</strong> ile giriş yapabilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Kullanıcı Adı</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-base text-white outline-none focus:border-indigo-500 transition-all font-mono"
            placeholder="personel123"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-base text-white outline-none focus:border-indigo-500 transition-all font-mono"
            placeholder="******"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-xs font-semibold">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold py-4 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px bg-slate-800 flex-1" />
        <span className="text-xs text-slate-500 font-medium">VEYA</span>
        <div className="h-px bg-slate-800 flex-1" />
      </div>

      {/* Google Butonu Yöneticiler İçin */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        type="button"
        className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-3 rounded-xl transition-all disabled:opacity-50 border border-slate-700 active:scale-[0.98]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span className="opacity-80">Google ile Yönetici Girişi Yap</span>
      </button>

      <div className="mt-8 text-center px-4">
        <p className="text-xs font-semibold text-slate-500 bg-slate-950 px-4 py-2 rounded-full inline-block border border-slate-800">
          Şifrenizi bilmiyorsanız yöneticinizden talep ediniz.
        </p>
      </div>

    </div>
  );
}
