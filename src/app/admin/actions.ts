"use server";

import { db } from "@/db";
import { companies } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function addCompany(formData: FormData) {
  const name = formData.get("name") as string;
  const adminEmail = formData.get("admin_email") as string;

  if (!name || !adminEmail) {
    throw new Error("Firma adı ve e-posta zorunludur.");
  }

  await db.insert(companies).values({
    name: name.trim(),
    adminEmail: adminEmail.trim(),
  });

  revalidatePath("/admin");
}
