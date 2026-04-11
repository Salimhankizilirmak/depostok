import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies, companyUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { addTeamMember } from "./actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  if (!email) redirect("/");

  const firma = await db
    .select({
      id: companies.id,
      name: companies.name,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.email, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!firma) redirect("/");

  const ekip = await db
    .select()
    .from(companyUsers)
    .where(eq(companyUsers.companyId, firma.id))
    .orderBy(desc(companyUsers.createdAt));

  const addTeamMemberWithId = addTeamMember.bind(null, firma.id);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30 sticky top-24">
            <h2 className="text-white font-semibold text-sm mb-6 flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/>
                  </svg>
               </div>
               Yeni Personel Ekle
            </h2>
            <form action={addTeamMemberWithId} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  E-posta Adresi
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="personel@firma.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl py-2.5 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
              >
                Ekle
              </button>
            </form>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Ekip Listesi</h2>
              <span className="text-xs text-slate-500">{ekip.length} kullanıcı</span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {ekip.map((uye) => (
                  <div
                    key={uye.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                       </div>
                       <div>
                          <p className="text-white text-sm font-medium">{uye.email}</p>
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold mt-0.5">Personel</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-400 text-xs tabular-nums">
                          {new Date(uye.createdAt).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })}
                       </p>
                       <span className="text-slate-600 text-[10px]">Katılım Tarihi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
