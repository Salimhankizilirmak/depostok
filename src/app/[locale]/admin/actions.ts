"use server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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
    role: "Yönetici",
  });

  revalidatePath("/admin");
}

/**
 * Super Admin Auth Check Shortcut
 */
async function checkSuperAdmin() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim());
  
  if (!superAdminEmails.includes(email)) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }
}

export async function addMemberToCompanySA(companyId: string, formData: FormData) {
  await checkSuperAdmin();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const role = formData.get("role") as string;

  if (!email || !role) throw new Error("E-posta ve rol zorunludur.");

  await db.insert(companyUsers).values({
    companyId,
    email,
    role,
  });

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function updateMemberRoleSA(companyId: string, userId: string, newRole: string) {
  await checkSuperAdmin();
  
  await db.update(companyUsers)
    .set({ role: newRole })
    .where(eq(companyUsers.id, userId));

  revalidatePath(`/admin/companies/${companyId}`);
}

export async function deleteMemberFromCompanySA(companyId: string, userId: string) {
  await checkSuperAdmin();

  await db.delete(companyUsers)
    .where(eq(companyUsers.id, userId));

  revalidatePath(`/admin/companies/${companyId}`);
}
