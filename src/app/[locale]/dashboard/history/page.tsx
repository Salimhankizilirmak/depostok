import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stockMovements, products } from "@/db/schema";
import { eq, desc, and, gte, lte, inArray, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import ExportExcelButton from "@/components/ExportExcelButton";
import HistoryFilters from "@/components/HistoryFilters";
import HistoryCalendar from "@/components/HistoryCalendar";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

import { getCompanyAndRole } from "@/lib/auth-repair";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  if (!email) redirect("/");

  const firma = await getCompanyAndRole(email);
  if (!firma) redirect("/");

  // Parametreleri çöz
  const params = await searchParams;
  const dateFrom = params.dateFrom as string;
  const dateTo = params.dateTo as string;
  const productIds = (params.productIds as string)?.split(",").filter(Boolean);
  const type = params.type as string;
  const view = params.view as string || "list";

  // Dinamik Filtreleri İnşa Et
  const filters = [eq(stockMovements.companyId, firma.id)];
  
  if (dateFrom) filters.push(gte(stockMovements.createdAt, `${dateFrom} 00:00:00`));
  if (dateTo) filters.push(lte(stockMovements.createdAt, `${dateTo} 23:59:59`));
  if (productIds && productIds.length > 0) filters.push(inArray(stockMovements.productId, productIds));
  
  if (type === "in") filters.push(eq(stockMovements.type, "in"));
  else if (type === "out") filters.push(eq(stockMovements.type, "out"));
  else if (type === "production") filters.push(like(stockMovements.description, "Üretim%"));

  const tDashboard = await getTranslations("Dashboard");
  const tHistory = await getTranslations("History");

  // Veri Çekme
  const hareketler = await db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
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
    .where(and(...filters))
    .orderBy(desc(stockMovements.createdAt));

  const allProducts = await db.select({ id: products.id, name: products.name, sku: products.sku }).from(products).where(eq(products.companyId, firma.id));

  // Clerk'ten kullanıcı bilgilerini çekip eşleştirme yap
  const uniqueEmails = Array.from(new Set(hareketler.map(h => h.userEmail).filter(Boolean))) as string[];
  const clerk = await clerkClient();
  const usersResponse = await clerk.users.getUserList({
    emailAddress: uniqueEmails,
    limit: 100
  });

  const userMap = new Map();
  usersResponse.data.forEach(u => {
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    const email = u.emailAddresses[0]?.emailAddress;
    if (email) {
      userMap.set(email, fullName || email);
    }
  });

  const getDisplayName = (email: string | null) => {
    if (!email) return "—";
    return userMap.get(email) || email;
  };

  const toplamGiris = hareketler
    .filter((h) => h.type === "in")
    .reduce((a, h) => a + h.quantity, 0);

  const toplamCikis = hareketler
    .filter((h) => h.type === "out")
    .reduce((a, h) => a + h.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Başlık ve Excel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            {tHistory("title")}
          </h1>
          <p className="text-slate-500 text-xs font-medium tracking-widest uppercase mt-1">
            {firma.name} / AUDIT & CONTROL CENTER
          </p>
        </div>
        {["Yönetici", "Super Admin", "Yetkili", "Mühendis"].includes(firma.userRole) && (
          <ExportExcelButton
              data={hareketler.map((h) => ({
                Tarih: new Date(h.createdAt).toLocaleString("tr-TR"),
                Ürün: h.productName,
                SKU: h.productSku || "—",
                Tip: h.type === "in" ? "Giriş" : "Çıkış",
                Miktar: h.quantity,
                Açıklama: h.description,
                "İşlemi Yapan": getDisplayName(h.userEmail),
              }))}
              fileName={`${firma.name}_Denetim_Raporu_${new Date().toLocaleDateString("tr-TR")}`}
            />
        )}
      </div>

      {/* Gelişmiş Filtreler */}
      <HistoryFilters products={allProducts} />

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{tHistory("totalIn")}</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">+{toplamGiris}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{tHistory("totalOut")}</p>
            <p className="text-2xl font-black text-red-400 tabular-nums">-{toplamCikis}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Filtrelenmiş İşlem</p>
            <p className="text-2xl font-black text-white tabular-nums">{hareketler.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl shadow-black/20">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Aktif Filtre</p>
            <p className="text-2xl font-black text-violet-400 tabular-nums">
              {filters.length - 1} {/* FirmaID filtresini sayma */}
            </p>
          </div>
      </div>

      {/* Görünüm Sekmeleri */}
      <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800 w-fit">
        <a 
          href={`?${new URLSearchParams({...Object.fromEntries(Object.entries(params).filter(([_,v])=>v!==undefined) as [string, string][]), view: "list"}).toString()}`}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${view === "list" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"}`}
        >
          {tHistory("listView")}
        </a>
        <a 
           href={`?${new URLSearchParams({...Object.fromEntries(Object.entries(params).filter(([_,v])=>v!==undefined) as [string, string][]), view: "calendar"}).toString()}`}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${view === "calendar" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" : "text-slate-500 hover:text-slate-300"}`}
        >
          {tHistory("calendarView")}
        </a>
      </div>

      {/* Ana İçerik */}
      {view === "calendar" ? (
        <HistoryCalendar data={hareketler} />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {hareketler.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <p className="text-slate-400 text-sm font-medium">Sonuç bulunamadı</p>
              <p className="text-slate-600 text-xs mt-1">Filtreleri değiştirmeyi deneyebilirsin.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/20">
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">{tDashboard("statusLabel")}</th>
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Ürün & Bilgi</th>
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">İşlemi Yapan</th>
                    <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Miktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hareketler.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${h.type === "in" ? "bg-emerald-500/50" : "bg-red-500/50"}`} />
                          <div>
                            <p className="text-white text-xs font-bold tabular-nums">
                              {new Date(h.createdAt).toLocaleDateString("tr-TR")}
                            </p>
                            <p className="text-slate-500 text-[10px] tabular-nums">
                              {new Date(h.createdAt).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-bold">{h.productName}</p>
                        <p className="text-slate-500 text-[10px] italic">{h.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-400 text-xs font-medium">{getDisplayName(h.userEmail)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-black tabular-nums ${h.type === "in" ? "text-emerald-400" : "text-red-400"}`}>
                          {h.type === "in" ? "+" : "-"}{h.quantity}
                        </span>
                        <span className="text-slate-600 text-[10px] ml-1 uppercase font-bold">adet</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
