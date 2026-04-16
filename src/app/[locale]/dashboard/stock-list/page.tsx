import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCompanyAndRole } from "@/lib/auth-repair";
import { getTranslations } from "next-intl/server";
import { like, lte, count } from "drizzle-orm";
import DashboardSearch from "@/components/DashboardSearch";
import Pagination from "@/components/Pagination";
import ExportExcelButton from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default async function StockListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { q, f, p } = await searchParams;
  const searchTerm = typeof q === "string" ? q : "";
  const filter = typeof f === "string" ? f : "all";
  const currentPage = typeof p === "string" ? parseInt(p) : 1;
  const pageSize = 50;
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);
  if (!firma) redirect("/");

  const t = await getTranslations("Dashboard");

  // RBAC yetkileri
  const canSeePrices = firma.userRole === "Yönetici" || firma.userRole === "Yetkili";

  // Sorgu Koşulları
  const conditions = [eq(products.companyId, firma.id)];
  
  if (searchTerm) {
    conditions.push(like(products.name, `%${searchTerm}%`));
  }
  
  if (filter === "critical") {
    conditions.push(lte(products.currentStock, products.criticalThreshold));
  }

  const whereClause = and(...conditions);

  // Toplam sayı
  const totalCountResult = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);
  const totalItems = totalCountResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const urunler = await db
    .select()
    .from(products)
    .where(whereClause)
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize)
    .orderBy(desc(products.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-6 border border-slate-800 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Stok Listesi</h1>
          <p className="text-slate-400 text-sm">Deponuzdaki tüm ürünlerin güncel miktar ve konum raporu.</p>
        </div>
        {["Yönetici", "Super Admin", "Yetkili", "Mühendis"].includes(firma.userRole) && (
          <ExportExcelButton
            data={urunler.map((u) => ({
              [t("productName")]: u.name,
              [t("sku")]: u.sku || "—",
              "Mevcut Stok": u.currentStock,
              ...(firma.locationSystemEnabled ? { [t("shelfLocation")]: u.location || "—" } : {}),
            }))}
            fileName={`${firma.name}_Stok_Listesi`}
          />
        )}
      </div>

      <DashboardSearch />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">{t("productList")}</h2>
            <span className="text-xs text-slate-500">{t("productCount", { count: urunler.length })}</span>
        </div>

        {urunler.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("productName")}</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("sku")}</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("productStatus")}</th>
                  {canSeePrices && (
                    <>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("unitPrice")}</th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("totalValue")}</th>
                    </>
                  )}
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("statusLabel")}</th>
                  {firma.locationSystemEnabled && (
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("shelfLocation")}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {urunler.map((urun) => {
                  const currentStock = urun.currentStock ?? 0;
                  const threshold = urun.criticalThreshold ?? 10;
                  const isCritical = currentStock <= threshold;
                  const stokDurum = currentStock === 0
                      ? { label: t("outOfStock"), color: "text-red-400 bg-red-500/10 border-red-500/20" }
                      : isCritical
                      ? { label: t("critical"), color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
                      : { label: t("sufficient"), color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

                  return (
                    <tr key={urun.id} className={`transition-colors hover:bg-slate-800/30`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold text-xs uppercase">{urun.name.charAt(0)}</div>
                          <div className="text-sm font-medium text-white">{urun.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {urun.sku ? <span className="font-mono text-xs text-slate-400">{urun.sku}</span> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xl font-bold text-white tabular-nums">{urun.currentStock ?? 0}</span>
                      </td>
                      {canSeePrices && (
                        <>
                          <td className="px-6 py-4 text-right"><span className="text-white text-sm font-medium tabular-nums">{urun.price.toLocaleString()} TL</span></td>
                          <td className="px-6 py-4 text-right"><span className="text-emerald-400 text-sm font-bold tabular-nums">{((urun.currentStock ?? 0) * urun.price).toLocaleString()} TL</span></td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${stokDurum.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />{stokDurum.label}
                        </span>
                      </td>
                      {firma.locationSystemEnabled && (
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono text-xs text-indigo-400">
                            {urun.location || "—"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
