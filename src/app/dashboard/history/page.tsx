import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { companies, stockMovements, products, companyUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ExportExcelButton from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
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

  // stock_movements + products JOIN
  const hareketler = await db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      createdAt: stockMovements.createdAt,
      productName: products.name,
      productSku: products.sku,
      userEmail: stockMovements.userEmail,
      description: stockMovements.description,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .where(eq(stockMovements.companyId, firma.id))
    .orderBy(desc(stockMovements.createdAt));

  const toplamGiris = hareketler
    .filter((h) => h.type === "in")
    .reduce((a, h) => a + h.quantity, 0);

  const toplamCikis = hareketler
    .filter((h) => h.type === "out")
    .reduce((a, h) => a + h.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Stok Hareket Geçmişi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {firma.name} firmasına ait tüm stok giriş ve çıkış hareketleri.
          </p>
        </div>

        {/* Özet */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
              +{toplamGiris}
            </p>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">Toplam Giriş</p>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-xl sm:text-2xl font-bold text-red-400 tabular-nums">
              -{toplamCikis}
            </p>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">Toplam Çıkış</p>
          </div>
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-[100px]">
            <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {hareketler.length}
            </p>
            <p className="text-slate-500 text-[10px] sm:text-xs mt-0.5">İşlem</p>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-sm">Tüm Hareketler</h2>
            <span className="text-xs text-slate-500">
              {hareketler.length} hareket
            </span>
          </div>
          <ExportExcelButton
            data={hareketler.map((h) => ({
              Tarih: new Date(h.createdAt).toLocaleString("tr-TR"),
              Ürün: h.productName,
              SKU: h.productSku || "—",
              Tip: h.type === "in" ? "Giriş" : "Çıkış",
              Miktar: h.quantity,
              Açıklama: h.description,
              "İşlemi Yapan": h.userEmail || "—",
            }))}
            fileName={`${firma.name}_Hareket_Gecmisi_${new Date().toLocaleDateString("tr-TR")}`}
          />
        </div>

        {hareketler.length === 0 ? (
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
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Henüz stok hareketi yok
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Ürünler sayfasından stok girişi veya çıkışı yapabilirsin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px] lg:min-w-0">
              <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Tarih
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Ürün
                  </th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    İşlem Tipi
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Açıklama
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    İşlemi Yapan
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                    Miktar
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {hareketler.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Tarih */}
                    <td className="px-6 py-4">
                      <p className="text-white text-sm tabular-nums">
                        {new Date(h.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-slate-500 text-xs tabular-nums mt-0.5">
                        {new Date(h.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Ürün */}
                    <td className="px-6 py-4">
                      <p className="text-white text-sm font-medium">
                        {h.productName}
                      </p>
                      {h.productSku && (
                        <span className="font-mono text-xs text-slate-500">
                          {h.productSku}
                        </span>
                      )}
                    </td>

                    {/* Tip Badge */}
                    <td className="px-6 py-4 text-center">
                      {h.type === "in" ? (
                        Giriş
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Çıkış
                      </span>
                    )}
                  </td>

                  {/* Açıklama */}
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm italic">
                      {h.description}
                    </p>
                  </td>

                  {/* İşlemi Yapan */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700">
                        {h.userEmail ? h.userEmail.substring(0, 1).toUpperCase() : "?"}
                      </div>
                      <p className="text-slate-400 text-xs">
                        {h.userEmail ? h.userEmail.split("@")[0] : "—"}
                      </p>
                    </div>
                  </td>

                    {/* Miktar */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-xl font-bold tabular-nums ${
                          h.type === "in" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {h.type === "in" ? "+" : "-"}
                        {h.quantity}
                      </span>
                      <span className="text-slate-500 text-xs ml-1">adet</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
