import { db } from "@/db";
import { companies } from "@/db/schema";
import { addCompany } from "./actions";
import { desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const firmalar = await db
    .select()
    .from(companies)
    .orderBy(desc(companies.createdAt));

  return (
    <div className="space-y-8">
      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Firma Yönetimi
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sisteme kayıtlı tüm firmaları görüntüle ve yeni firma ekle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ─── Sol: Firma Ekleme Formu ─── */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-sm">
                Yeni Firma Ekle
              </h2>
            </div>

            <form action={addCompany} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-400 mb-1.5"
                >
                  Firma Adı
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="örn. Anadolu Lojistik A.Ş."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="admin_email"
                  className="block text-xs font-medium text-slate-400 mb-1.5"
                >
                  Admin E-posta
                </label>
                <input
                  id="admin_email"
                  name="admin_email"
                  type="email"
                  required
                  placeholder="admin@firma.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl py-2.5 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 active:scale-[0.98]"
              >
                Firmayı Kaydet
              </button>
            </form>
          </div>

          {/* İstatistik Kartı */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
              Toplam Firma
            </p>
            <p className="text-3xl font-bold text-white">
              {firmalar.length}
            </p>
            <p className="text-slate-500 text-xs mt-1">sistemde kayıtlı</p>
          </div>
        </div>

        {/* ─── Sağ: Firma Listesi ─── */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">
                Kayıtlı Firmalar
              </h2>
              <span className="text-xs text-slate-500">
                {firmalar.length} firma
              </span>
            </div>

            {firmalar.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  Henüz firma eklenmedi
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Sol formu kullanarak ilk firmanı ekle.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="divide-y divide-slate-800 min-w-[500px] md:min-w-0">
                  {firmalar.map((firma, index) => (
                    <div
                      key={firma.id}
                      className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
                    >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-bold text-sm">
                        {firma.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {firma.name}
                      </p>
                      <p className="text-slate-500 text-xs truncate">
                        {firma.adminEmail}
                      </p>
                    </div>

                    {/* Tarih & İşlem */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-slate-600 text-[10px] uppercase tracking-wider mb-0.5">Kayıt</p>
                        <p className="text-slate-400 text-xs font-medium">
                          {new Date(firma.createdAt).toLocaleDateString("tr-TR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-slate-800" />
                      <Link
                        href={`/admin/companies/${firma.id}`}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-[10px] sm:text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                        Yönet
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
