"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
   const { handleRedirectCallback, loaded: clerkLoaded } = useClerk();
   const router = useRouter();
   const hasRun = useRef(false);

   useEffect(() => {
     if (!clerkLoaded || hasRun.current) return;
     hasRun.current = true;

     handleRedirectCallback({
       signInForceRedirectUrl: "/dashboard",
       signUpForceRedirectUrl: "/dashboard",
       signInFallbackRedirectUrl: "/dashboard",
       signUpFallbackRedirectUrl: "/dashboard",
     }).catch((err) => {
       console.error("SSO Callback Error:", err);
       // Hata durumunda sign-in sayfasına hata parametresiyle dön
       router.push("/sign-in?error=sso_failed");
     });
   }, [clerkLoaded, handleRedirectCallback, router]);

   return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Giriş tamamlanıyor...</p>
      </div>
    </div>
   );
}
