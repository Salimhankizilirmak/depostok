import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companyUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCompanyAndRole } from "@/lib/auth-repair";
import TeamManagement from "@/components/TeamManagement";
import WarehouseSettings from "@/components/WarehouseSettings";
import { addTeamMember, updateUserRole } from "@/actions/team";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);

  if (!firma) redirect("/");

  // Sadece 'Yönetici' olanlar bu sayfaya girebilir
  if (firma.userRole !== "Yönetici") {
    redirect("/dashboard");
  }

  const ekip = await db
    .select()
    .from(companyUsers)
    .where(eq(companyUsers.companyId, firma.id))
    .orderBy(desc(companyUsers.createdAt));

  /**
   * Dashboard tarafı için güncelleme aksiyonu (Firma ID parametresiz versiyon)
   */
  const handleUpdateRole = async (cid: string, uid: string, role: string) => {
    "use server";
    await updateUserRole(uid, role);
  };

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Ekip Yönetimi
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {firma.name} firmasında sisteme erişimi olan personelleri yönetin.
        </p>
      </div>

      <TeamManagement
        companyId={firma.id}
        users={ekip.map(u => ({
          ...u,
          createdAt: u.createdAt as string
        }))}
        currentUserEmail={email}
        addMemberAction={addTeamMember}
        updateRoleAction={handleUpdateRole}
      />

      <WarehouseSettings
        companyId={firma.id}
        initialEnabled={firma.locationSystemEnabled}
        initialFormat={firma.locationFormat}
      />
    </div>
  );
}
