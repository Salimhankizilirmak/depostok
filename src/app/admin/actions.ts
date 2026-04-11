"use server";

import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function addCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const adminEmail = formData.get("admin_email") as string;

  if (!name || !adminEmail) {
    throw new Error("Firma adı ve e-posta zorunludur.");
  }

  // 1) Firmayı ekle ve ID'sini al
  const [newCompany] = await db.insert(companies).values({
    name: name.trim(),
    adminEmail: adminEmail.trim(), // Geriye dönük uyumluluk için hala tutuyoruz
  }).returning({ id: companies.id });

  // 2) Yetkili kullanıcıyı company_users tablosuna ekle
  await db.insert(companyUsers).values({
    companyId: newCompany.id,
    email: adminEmail.trim(),
  });

  revalidatePath("/admin");
}
