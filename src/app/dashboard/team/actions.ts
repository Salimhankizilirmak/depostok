"use server";

import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addTeamMember(companyId: string, formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    throw new Error("E-posta adresi zorunludur.");
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
  });

  revalidatePath("/dashboard/team");
}
