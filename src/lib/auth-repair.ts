import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Kullanıcıyı hem company_users tablosunda hem de bağlı olduğu firma bilgisinde arar.
 * Eğer kullanıcı firmanın sahibi (adminEmail) ise ama ekip listesinde yoksa otomatik ekler.
 */
export async function getCompanyAndRole(email: string) {
  if (!email) return null;

  // 1) Mevcut ekip üyeliğini kontrol et
  const existing = await db
    .select({
      id: companies.id,
      name: companies.name,
      adminEmail: companies.adminEmail,
      locationSystemEnabled: companies.locationSystemEnabled,
      locationFormat: companies.locationFormat,
      bomSystemEnabled: companies.bomSystemEnabled,
      userRole: companyUsers.role,
      userId: companyUsers.id,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.email, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      adminEmail: existing.adminEmail,
      locationSystemEnabled: existing.locationSystemEnabled,
      locationFormat: existing.locationFormat,
      bomSystemEnabled: existing.bomSystemEnabled,
      userRole: existing.userRole as string,
      userId: existing.userId,
    };
  }

  // 2) Eğer ekipte yoksa, 'companies' tablosunda admin olup olmadığını kontrol et
  const companyAdmin = await db
    .select()
    .from(companies)
    .where(eq(companies.adminEmail, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (companyAdmin) {
    // FALLBACK / REPAIR: Admin e-postası eşleşiyor ama kullanıcı listesinde yok.
    // Kullanıcıyı otomatik olarak 'Yönetici' rolüyle ekle.
    const [newMember] = await db.insert(companyUsers).values({
      companyId: companyAdmin.id,
      email: email,
      role: "Yönetici",
    }).returning();

    return {
      id: companyAdmin.id,
      name: companyAdmin.name,
      adminEmail: companyAdmin.adminEmail,
      locationSystemEnabled: companyAdmin.locationSystemEnabled,
      locationFormat: companyAdmin.locationFormat,
      bomSystemEnabled: companyAdmin.bomSystemEnabled,
      userRole: "Yönetici",
      userId: newMember.id,
    };
  }

  return null;
}
