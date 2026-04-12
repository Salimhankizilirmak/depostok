import { db } from "@/db";
import { companies, stockMovements } from "@/db/schema";
import { eq, sql, and, gt } from "drizzle-orm";
import { sendMail } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Security check: Vercel Cron sends a secret header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const tumFirmalar = await db.select().from(companies);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString();

    for (const firma of tumFirmalar) {
      // Haftalık hareketleri hesapla
      const stats = await db
        .select({
          type: stockMovements.type,
          total: sql<number>`SUM(${stockMovements.quantity})`,
        })
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.companyId, firma.id),
            gt(stockMovements.createdAt, dateStr)
          )
        )
        .groupBy(stockMovements.type);

      const inQty = stats.find(s => s.type === 'in')?.total || 0;
      const outQty = stats.find(s => s.type === 'out')?.total || 0;

      // E-posta gönder
      await sendMail({
        to: firma.adminEmail,
        subject: `📊 Haftalık Stok Özeti: ${firma.name}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">LEADNOVA</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Premium Yönetici Özeti</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Bu Haftanın Özeti</h2>
              
              <div style="display: flex; gap: 20px; margin-bottom: 32px;">
                <div style="flex: 1; text-align: center; padding: 16px; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                  <p style="color: #166534; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0;">Toplam Giriş</p>
                  <p style="color: #15803d; font-size: 28px; font-weight: 800; margin: 8px 0 0 0;">+${inQty}</p>
                </div>
                <div style="flex: 1; text-align: center; padding: 16px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
                  <p style="color: #991b1b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin: 0;">Toplam Çıkış</p>
                  <p style="color: #b91c1c; font-size: 28px; font-weight: 800; margin: 8px 0 0 0;">-${outQty}</p>
                </div>
              </div>

              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Sayın Yöneticimiz, <strong>${firma.name}</strong> deponuzdaki haftalık hareket özetiniz yukarıdaki gibidir. 
                Daha fazla detay ve detaylı raporlar için Leadnova Dashboard'u ziyaret edebilirsiniz.
              </p>
              
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://leadnova.vercel.app/dashboard" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Dashboard'a Git</a>
              </div>
            </div>

            <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
              <p>© 2026 Leadnova Stok Kontrol Sistemi. Tüm hakları saklıdır.</p>
              <p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
            </div>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, message: "Emails sent successfully" });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
