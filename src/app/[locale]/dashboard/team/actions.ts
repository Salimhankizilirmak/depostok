"use server";

import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addTeamMember(companyId: string, formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email || !role) {
    throw new Error("E-posta adresi ve rol zorunludur.");
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1) Kullanıcı zaten ekli mi kontrol et
  const existingUser = await db
    .select()
    .from(companyUsers)
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.email, trimmedEmail)
      )
    )
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existingUser) {
    throw new Error("Bu kullanıcı zaten ekibinize kayıtlı.");
  }

  // 2) Yeni kullanıcıyı ekle
  await db.insert(companyUsers).values({
    companyId,
    email: trimmedEmail,
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
