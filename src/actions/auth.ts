"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function bindIdentitySA(username: string, password: string) {
  const user = await currentUser();
  if (!user) {
    throw new Error("Oturum bulunamadı.");
  }

  const client = await clerkClient();
  
  try {
    // Backend API allows setting/updating username and password
    await client.users.updateUser(user.id, {
      username: username.trim(),
      password,
    });
  } catch (error: any) {
    console.error("Clerk Update User Error:", error);
    const errorMessage = error.errors?.[0]?.message || error.message || "Kimlik bilgileri güncellenirken bir hata oluştu.";
    throw new Error(`Hata: ${errorMessage}`);
  }

  revalidatePath("/dashboard/settings");
}
