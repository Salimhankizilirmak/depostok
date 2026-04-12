import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies, products, companyUsers, stockMovements } from "@/db/schema";
import { eq, and, gt, desc, sql, notInArray, lte } from "drizzle-orm";
import { addProduct } from "./actions";
import StockButtons from "@/components/StockButtons";
import ExportExcelButton from "@/components/ExportExcelButton";
import { redirect } from "next/navigation";

import { getCompanyAndRole } from "@/lib/auth-repair";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);

  if (!firma) redirect("/");

  // RBAC yetkileri
  const isManager = firma.userRole === "Yönetici";
  const canSeePrices = firma.userRole === "Yönetici" || firma.userRole === "Yetkili";

  const urunler = await db
    .select()
    .from(products)
    .where(eq(products.companyId, firma.id));

  // Toplam stok hesapla
  const toplamStok = urunler.reduce((acc, u) => acc + (u.currentStock ?? 0), 0);

  // Server Action binder — companyId'yi closure olarak geç
  const addProductWithId = addProduct.bind(null, firma.id);

  // --- Executive Analytics ---
  let deadStockReport = null;
  let monthlyChampion = null;

  if (canSeePrices) {
    // 1) Cash Trap Radar (90 Days Inactive)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateStr = ninetyDaysAgo.toISOString();

    // Products with 'out' movements in last 90 days
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
      {/* ─── Hero Banner & Hoş Geldiniz Kartı ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-600 rounded-3xl p-8 shadow-2xl shadow-violet-500/20">
        {/* Dekoratif Arka Plan Efektleri */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Hoş Geldiniz, {email?.split('@')[0]}
            </h2>
            <p className="text-indigo-100/80 text-lg font-medium leading-relaxed">
              Deponuz güvende. İşlemlerinizi aşağıdan yönetebilirsiniz. Sisteminiz şu an tam kapasite ve optimize durumda.
            </p>
          </div>

          {/* Analytics Cards (Only for privileged users) */}
          {canSeePrices && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
              {/* Ölü Stok Kartı (Nakit Tuzağı) */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/30 border border-red-500/40 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <h3 className="text-white text-sm font-bold">Nakit Tuzağı</h3>
                </div>
                {deadStockReport ? (
                  <p className="text-white/90 text-[11px] leading-snug">
                    <span className="font-bold">{deadStockReport.count} ürün</span> toplamda <span className="font-bold text-red-200">{deadStockReport.totalValue.toLocaleString("tr-TR")} TL</span> sermayeyi kilitliyor.
                  </p>
                ) : (
                  <p className="text-white/60 text-[11px] italic">Ölü stok bulunamadı.</p>
                )}
              </div>

              {/* Ayın Rekortmeni Kartı */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/30 border border-yellow-400/40 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  </div>
                  <h3 className="text-white text-sm font-bold">Ayın Rekortmeni</h3>
                </div>
                {monthlyChampion ? (
                  <p className="text-white/90 text-[11px] leading-snug">
                    <span className="font-bold">{monthlyChampion.name}</span> ürünü bu ay <span className="font-bold text-yellow-200">{monthlyChampion.qty}</span> hareketle zirvede.
                  </p>
                ) : (
                  <p className="text-white/60 text-[11px] italic">Veri toplanıyor...</p>
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-sm">Yeni Ürün Ekle</h2>
        </div>

        <form action={addProductWithId}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Ürün Adı */}
            <div className="sm:col-span-1">
              <label
                htmlFor="product-name"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Ürün Adı <span className="text-red-400">*</span>
              </label>
              <input
                id="product-name"
                name="name"
                type="text"
                required
                placeholder="örn. Çelik Boru 50mm"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* SKU */}
            <div>
              <label
                htmlFor="product-sku"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Stok Kodu (SKU)
              </label>
              <input
                id="product-sku"
                name="sku"
                type="text"
                placeholder="örn. CB-50-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Başlangıç Stoğu */}
            <div>
              <label
                htmlFor="product-stock"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Başlangıç Stoğu
              </label>
              <input
                id="product-stock"
                name="current_stock"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Birim Fiyat */}
            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Birim Fiyat (TL)
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Kritik Stok Seviyesi */}
            <div>
              <label
                htmlFor="product-threshold"
                className="block text-xs font-medium text-slate-400 mb-1.5"
              >
                Kritik Stok Uyarı Seviyesi
              </label>
              <input
                id="product-threshold"
                name="critical_threshold"
                type="number"
                min="0"
                defaultValue="10"
                placeholder="10"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
            >
              Ürünü Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* ─── Ürün Tablosu ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-sm">Ürün Listesi</h2>
            <span className="text-xs text-slate-500">{urunler.length} ürün</span>
          </div>
          <ExportExcelButton
            data={urunler.map((u) => ({
              "Ürün Adı": u.name,
              "Stok Kodu (SKU)": u.sku || "—",
              "Mevcut Stok": u.currentStock,
            }))}
            fileName={`${firma.name}_Stok_Raporu_${new Date().toLocaleDateString("tr-TR")}`}
          />
        </div>

        {urunler.length === 0 ? (
          /* Boş state */
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Henüz ürün eklenmedi
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Yukarıdaki formu kullanarak ilk ürününü ekle.
            </p>
          </div>
        ) : (
          /* Ürün tablosu */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Ürün Adı
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    SKU
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Mevcut Stok
                  </th>
                  {canSeePrices && (
                    <>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                        Birim Fiyat
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                        Toplam Değer
                      </th>
                    </>
                  )}
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Durum
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {urunler.map((urun) => {
                  const currentStock = urun.currentStock ?? 0;
                  const threshold = urun.criticalThreshold ?? 10;
                  const isCritical = currentStock <= threshold;

                  const stokDurum =
                    currentStock === 0
                      ? { label: "Tükendi", color: "text-red-400 bg-red-500/10 border-red-500/20" }
                      : isCritical
                      ? { label: "Kritik", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
                      : { label: "Yeterli", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

                  return (
                    <tr
                      key={urun.id}
                      className={`transition-colors ${
                        isCritical 
                          ? "bg-red-500/5 hover:bg-red-500/10" 
                          : "hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Ürün Adı */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-300 font-bold text-xs">
                              {urun.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white font-semibold text-sm">
                            {urun.name}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        {urun.sku ? (
                          <span className="font-mono text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-md px-2 py-1">
                            {urun.sku}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Stok Miktarı */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold text-white tabular-nums">
                          {urun.currentStock ?? 0}
                        </span>
                        <span className="text-slate-500 text-xs ml-1">adet</span>
                      </td>

                      {/* RBAC Fiyat Sütunları */}
                      {canSeePrices && (
                        <>
                          <td className="px-6 py-4 text-right">
                            <span className="text-white text-sm font-medium tabular-nums">
                              {urun.price.toLocaleString("tr-TR")} TL
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-emerald-400 text-sm font-bold tabular-nums">
                              {((urun.currentStock ?? 0) * urun.price).toLocaleString("tr-TR")} TL
                            </span>
                          </td>
                        </>
                      )}

                      {/* Durum Badge */}
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${stokDurum.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {stokDurum.label}
                        </span>
                      </td>

                      {/* İşlemler */}
                      <td className="px-6 py-4">
                        <StockButtons
                          productId={urun.id}
                          companyId={firma.id}
                          productName={urun.name}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
