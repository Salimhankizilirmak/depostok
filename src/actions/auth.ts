"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Clerk teknik hatalarını kullanıcı dostu Türkçe metinlere dönüştürür.
 */
function translateClerkError(err: string): string {
  if (err.includes("short")) return "Şifre çok kısa. Lütfen daha uzun bir şifre belirleyin.";
  if (err.includes("username") && err.includes("taken")) return "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.";
  if (err.includes("password") && err.includes("pwned")) return "Bu şifre çok yaygın/güvensiz. Lütfen daha karmaşık bir şifre seçin.";
  if (err.includes("character")) return "Şifredeki karakterler kısıtlamaya takıldı.";
  
  return err; // Varsayılan durumda orijinali dön (ama tırnakları temizle vb. gerekebilir)
}

export async function bindIdentitySA(username: string, password: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." };
    }

    const client = await clerkClient();
    
    try {
      // Backend API allows setting/updating username and password
      await client.users.updateUser(user.id, {
        username: username.trim().toLowerCase(), // Kullanıcı adlarını normalize edelim
        password,
      });

      revalidatePath("/dashboard/settings");
      return { success: true };
    } catch (error: any) {
      console.error("Clerk Update User Error:", error);
      const rawError = error.errors?.[0]?.message || error.message || "Kimlik bilgileri güncellenemedi.";
      return { 
        success: false, 
        error: translateClerkError(rawError) 
      };
    }
  } catch (globalError: any) {
    console.error("Global Auth Action Error:", globalError);
    return { success: false, error: "Sistemsel bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
