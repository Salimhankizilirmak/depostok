import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addProduct } from "./actions";
import StockButtons from "@/components/StockButtons";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;

  if (!email) redirect("/");

  const firma = await db
    .select()
    .from(companies)
    .where(eq(companies.adminEmail, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!firma) redirect("/");

  const urunler = await db
    .select()
    .from(products)
    .where(eq(products.companyId, firma.id));

  // Toplam stok hesapla
  const toplamStok = urunler.reduce((acc, u) => acc + (u.currentStock ?? 0), 0);

  // Server Action binder — companyId'yi closure olarak geç
  const addProductWithId = addProduct.bind(null, firma.id);

  return (
    <div className="space-y-8">
      {/* Sayfa Başlığı */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Stok Yönetimi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {firma.name} firmasına ait ürün ve stok bilgilerini yönet.
          </p>
        </div>

        {/* Özet istatistikler */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-white">{urunler.length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Ürün</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-[90px]">
            <p className="text-2xl font-bold text-emerald-400">{toplamStok}</p>
            <p className="text-slate-500 text-xs mt-0.5">Toplam Stok</p>
          </div>
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
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl px-6 py-2.5 transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98]"
            >
              Ürünü Kaydet
            </button>
          </div>
        </form>
      </div>

      {/* ─── Ürün Tablosu ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Ürün Listesi</h2>
          <span className="text-xs text-slate-500">{urunler.length} ürün</span>
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
                  const stokDurum =
                    (urun.currentStock ?? 0) === 0
                      ? { label: "Tükendi", color: "text-red-400 bg-red-500/10 border-red-500/20" }
                      : (urun.currentStock ?? 0) < 10
                      ? { label: "Kritik", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
                      : { label: "Yeterli", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };

                  return (
                    <tr
                      key={urun.id}
                      className="hover:bg-slate-800/30 transition-colors"
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
