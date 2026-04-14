"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateCompanySettings(
  companyId: string,
  settings: {
    locationSystemEnabled?: boolean;
    locationFormat?: string;
    bomSystemEnabled?: boolean;
  }
) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) throw new Error("Oturum açılmadı.");

  // Role kontrolü (Sadece Yönetici)
  const { getCompanyAndRole } = await import("@/lib/auth-repair");
  const firma = await getCompanyAndRole(email);
  if (!firma || firma.id !== companyId || firma.userRole !== "Yönetici") {
    throw new Error("Bu işlemi yapmaya yetkiniz yok.");
  }

  await db
    .update(companies)
    .set({
      ...settings,
    })
    .where(eq(companies.id, companyId));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}
