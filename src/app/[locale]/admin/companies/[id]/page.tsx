import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import TeamManagement from "@/components/TeamManagement";
import { 
  addMemberToCompanySA, 
  updateMemberRoleSA, 
  deleteMemberFromCompanySA 
} from "@/actions/admin";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export const dynamic = "force-dynamic";



export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  const firma = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!firma) notFound();

  const ekip = await db
    .select()
    .from(companyUsers)
    .where(eq(companyUsers.companyId, id))
    .orderBy(desc(companyUsers.createdAt));

  return (
    <div className="space-y-8">
      {/* Geri Dönüş ve Başlık */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium w-fit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Geri Dön
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {firma.name} <span className="text-slate-500 font-normal">Yönetimi</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Firmanın ekip üyelerini, rollerini ve erişim yetkilerini kontrol edin.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-500 font-mono">
            ID: {firma.id}
          </div>
        </div>
      </div>

      {/* Ekip Yönetimi (Reusable Component) */}
      <TeamManagement
        companyId={firma.id}
        users={ekip.map(u => ({
          ...u,
          createdAt: u.createdAt as string
        }))}
        currentUserEmail={email}
        addMemberAction={addMemberToCompanySA}
        updateRoleAction={updateMemberRoleSA}
        deleteMemberAction={deleteMemberFromCompanySA}
        isAdminView={true}
      />
    </div>
  );
}
