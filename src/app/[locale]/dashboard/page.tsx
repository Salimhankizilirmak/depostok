import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { products, stockMovements } from "@/db/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { addProduct } from "@/actions/dashboard";
import StockButtons from "@/components/StockButtons";
import ExportExcelButton from "@/components/ExportExcelButton";
import ImportExcelButton from "@/components/ImportExcelButton";
import AttributesInput from "@/components/AttributesInput";
import { redirect } from "next/navigation";
import { getCompanyAndRole } from "@/lib/auth-repair";
import { getTranslations } from "next-intl/server";
import { like, lte, count } from "drizzle-orm";
import DashboardSearch from "@/components/DashboardSearch";
import DeleteProductButton from "@/components/DeleteProductButton";
import EditProductModal from "@/components/EditProductModal";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
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

  // Toplam sayı (Pagination için)
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
    .orderBy(desc(products.id)); // En son eklenenler önce? Ya da ID bazlı

  // Server Action binder
  const addProductWithId = addProduct.bind(null, firma.id);

  // --- Executive Analytics ---
  let deadStockReport = null;
  let monthlyChampion = null;

  if (canSeePrices) {
    // 1) Cash Trap Radar (90 Days Inactive)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateStr = ninetyDaysAgo.toISOString();

    const activeProductIds = await db
      .selectDistinct({ productId: stockMovements.productId })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.companyId, firma.id),
          eq(stockMovements.type, "out"),
          gt(stockMovements.createdAt, dateStr)
        )
      )
      .then((rows) => rows.map((r) => r.productId));

    const deadStockProducts = activeProductIds.length > 0 
      ? urunler.filter(u => u.currentStock > 0 && !activeProductIds.includes(u.id))
      : urunler.filter(u => u.currentStock > 0);

    if (deadStockProducts.length > 0) {
      const totalLockedCash = deadStockProducts.reduce((acc, u) => acc + (u.currentStock * u.price), 0);
      deadStockReport = {
        count: deadStockProducts.length,
        totalValue: totalLockedCash,
      };
    }

    // 2) Monthly Record
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    const monthStartStr = firstDayOfMonth.toISOString();

    const topMovement = await db
      .select({
        productId: stockMovements.productId,
        totalQty: sql<number>`SUM(${stockMovements.quantity})`,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.companyId, firma.id),
          gt(stockMovements.createdAt, monthStartStr)
        )
      )
      .groupBy(stockMovements.productId)
      .orderBy(desc(sql`SUM(${stockMovements.quantity})`))
      .limit(1)
      .then(r => r[0]);

    if (topMovement) {
      const championProduct = urunler.find(u => u.id === topMovement.productId);
      if (championProduct) {
        monthlyChampion = {
          name: championProduct.name,
          qty: topMovement.totalQty,
        };
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-600 rounded-3xl p-8 shadow-2xl shadow-violet-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              {t("welcome")}, {email?.split('@')[0]}
            </h2>
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed">
              {t("status")}
            </p>
          </div>

          {canSeePrices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/30 border border-red-500/40 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h3 className="text-white text-sm font-bold">{t("deadStock")}</h3>
                </div>
                {deadStockReport ? (
                  <p className="text-white/90 text-[11px] leading-snug">
                    {t("deadStockDesc", { count: deadStockReport.count, value: deadStockReport.totalValue.toLocaleString() })}
                  </p>
                ) : (
                  <p className="text-white/60 text-[11px] italic">{t("noDeadStock")}</p>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/30 border border-yellow-400/40 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  </div>
                  <h3 className="text-white text-sm font-bold">{t("monthlyChampion")}</h3>
                </div>
                {monthlyChampion ? (
                  <p className="text-white/90 text-[11px] leading-snug">
                    {t("monthlyChampionDesc", { name: monthlyChampion.name, qty: monthlyChampion.qty })}
                  </p>
                ) : (
                  <p className="text-white/60 text-[11px] italic">{t("noChampion")}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Yeni Ürün Ekleme Formu ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-black/30">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-sm">{t("addProduct")}</h2>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <p className="text-slate-400 text-xs">
            {t("addProductDesc") || "Hızlıca yeni bir ürün ekleyebilir veya Excel listesi yükleyebilirsiniz."}
          </p>
          <ImportExcelButton companyId={firma.id} />
        </div>

        <form action={addProductWithId}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="product-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                {t("productName")} <span className="text-red-400">*</span>
              </label>
              <input id="product-name" name="name" type="text" required placeholder="..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="product-sku" className="block text-xs font-medium text-slate-400 mb-1.5">{t("sku")}</label>
              <input id="product-sku" name="sku" type="text" placeholder="..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="product-stock" className="block text-xs font-medium text-slate-400 mb-1.5">{t("initialStock")}</label>
              <input id="product-stock" name="current_stock" type="number" min="0" defaultValue="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="product-price" className="block text-xs font-medium text-slate-400 mb-1.5">{t("unitPrice")}</label>
              <input id="product-price" name="price" type="number" step="0.01" min="0" defaultValue="0" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="product-unit" className="block text-xs font-medium text-slate-400 mb-1.5">{t("unit")}</label>
              <select id="product-unit" name="unit" defaultValue="Adet" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer">
                <option value="Adet">Adet</option>
                <option value="kg">kg</option>
                <option value="metre">Metre</option>
                <option value="paket">Paket</option>
                <option value="litre">Litre</option>
              </select>
            </div>
            <div>
              <label htmlFor="product-threshold" className="block text-xs font-medium text-slate-400 mb-1.5">{t("criticalLevel")}</label>
              <input id="product-threshold" name="critical_threshold" type="number" min="0" defaultValue="10" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
            </div>
            {firma.locationSystemEnabled && (
              <div>
                <label htmlFor="product-location" className="block text-xs font-medium text-slate-400 mb-1.5">{t("shelfLocation")}</label>
                <input id="product-location" name="location" type="text" placeholder="..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
              </div>
            )}
          </div>

          <AttributesInput />

          <div className="mt-8 flex justify-end">
            <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all duration-200 shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
              {t("saveProduct")}
            </button>
          </div>
        </form>
      </div>

      <DashboardSearch />

      {/* ─── Ürün Tablosu ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-sm">{t("productList")}</h2>
            <span className="text-xs text-slate-500">{t("productCount", { count: urunler.length })}</span>
          </div>
          <ExportExcelButton
            data={urunler.map((u) => ({
              [t("productName")]: u.name,
              [t("sku")]: u.sku || "—",
              "Mevcut Stok": u.currentStock,
              ...(firma.locationSystemEnabled ? { [t("shelfLocation")]: u.location || "—" } : {}),
            }))}
            fileName={`${firma.name}_Stok_Raporu`}
          />
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
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{t("actions")}</th>
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
                    <tr key={urun.id} className={`transition-colors ${isCritical ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-slate-800/30"}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs uppercase">{urun.name.charAt(0)}</div>
                          <div>
                            <div className="text-sm font-medium text-white">{urun.name}</div>
                            {urun.attributes && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(JSON.parse(urun.attributes as string)).map(([k, v]) => (
                                  <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                    {k}: {v as string}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {urun.sku ? <span className="font-mono text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-md px-2 py-1">{urun.sku}</span> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold text-white tabular-nums">{urun.currentStock ?? 0}</span>
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
                          <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2.5 py-1.5">
                            {urun.location || "—"}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StockButtons productId={urun.id} companyId={firma.id} productName={urun.name} />
                          {firma.userRole === "Yönetici" && (
                            <>
                              <EditProductModal 
                                product={urun} 
                                companyId={firma.id} 
                                locationSystemEnabled={firma.locationSystemEnabled} 
                              />
                              <DeleteProductButton productId={urun.id} companyId={firma.id} />
                            </>
                          )}
                        </div>
                      </td>
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
