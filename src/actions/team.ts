"use server";

import { db } from "@/db";
import { companyUsers, companies } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { clerkClient } from "@clerk/nextjs/server";

export async function addTeamMember(companyId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!name || !username || !password || !role) {
    throw new Error("Personel Adı, Kullanıcı Adı, Şifre ve Rol zorunludur.");
  }

  const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
  const dummyEmail = `${cleanUsername}@${companyId}.leadnova.com`.toLowerCase();

  // 1) Kullanıcı zaten ekli mi kontrol et
  const existingUser = await db
    .select()
    .from(companyUsers)
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.email, dummyEmail)
      )
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existingUser) {
    throw new Error("Bu kullanıcı adı zaten ekibinize kayıtlı.");
  }

  // 2) Clerk üzerinde kullanıcıyı oluştur
  const client = await clerkClient();
  try {
    await client.users.createUser({
      emailAddress: [dummyEmail],
      username: cleanUsername,
      password: password,
      firstName: name.trim(),
    });
  } catch (error: any) {
    console.error("Clerk Create User Error:", error);
    const errorMessage = error.errors?.[0]?.message || error.message || "Kullanıcı oluşturulurken bir hata oluştu.";
    throw new Error(`Clerk Hatası: ${errorMessage}`);
  }

  // 3) Yeni kullanıcıyı veri tabanına ekle
  await db.insert(companyUsers).values({
    companyId,
    email: dummyEmail,
    role: role,
  });

  revalidatePath("/dashboard/team");
}

export async function updateUserRole(userId: string, newRole: string) {
  await db
    .update(companyUsers)
    .set({ role: newRole })
    .where(eq(companyUsers.id, userId));

  revalidatePath("/dashboard/team");
}

export async function updateCompanyWarehouseSettings(
  companyId: string,
  locationSystemEnabled: boolean,
  locationFormat: string
) {
  await db
    .update(companies)
    .set({
      locationSystemEnabled,
      locationFormat,
    })
    .where(eq(companies.id, companyId));

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
}
