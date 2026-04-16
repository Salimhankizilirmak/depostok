import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendMail = async ({ 
  to, 
  subject, 
  html 
}: { 
  to: string; 
  subject: string; 
  html: string 
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Leadnova System" <leadnovasystem@gmail.com>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error("KRİTİK MAİL HATASI: Gmail kimlik doğrulaması (App Password) geçersiz. Lütfen .env dosyasındaki GMAIL_APP_PASSWORD bilgisini kontrol edin.");
    } else {
      console.error("Error sending email:", error);
    }
    // Hata durumunda uygulamanın geri kalanının çökmemesi için sessizce hata dönüyoruz
    return { success: false, error: error.message };
  }
};

const LOGO_URL = "https://i.ibb.co/Gr8zFCd/kurumsal.jpg";

/**
 * Kurumsal Aktivasyon Maili
 */
export const sendActivationEmail = async (toEmail: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
      <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <center><img src="${LOGO_URL}" alt="Novexis Logo" style="width: 180px; margin-bottom: 40px;"></center>
        
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 24px;">Leadnova Dünyasına Hoş Geldiniz</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
          Sayın Yöneticimiz,<br><br>
          Leadnova Yeni Nesil Depo ve Üretim Yönetim Sistemi altyapısına hoş geldiniz. Şirketinizin dijital dönüşüm yolculuğunda bizi tercih ettiğiniz için teşekkür ederiz.
        </p>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">
          Leadnova olarak bizler sadece bir yazılım değil; hataları sıfırlayan, ölü stoğu nakde çeviren ve üretim hattınızı kusursuzlaştıran uçtan uca bir ekosistem sunuyoruz. Sisteminizi hemen aktif etmek ve kurulumu tamamlamak için lütfen aşağıdaki bağlantıya tıklayarak giriş yapınız.
        </p>
        
        <center>
          <a href="https://stok.novexistech.com/tr" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 18px 36px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Leadnova Sistemini Aktive Et
          </a>
        </center>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.6;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.<br>
          © ${new Date().getFullYear()} Novexis Tech | Leadnova ERP Solutions
        </p>
      </div>
    </div>
  `;

  return sendMail({
    to: toEmail,
    subject: "Leadnova | Sistem Aktivasyonu ve Kurulum",
    html,
  });
};

/**
 * Kurumsal Hoş Geldin Maili
 */
export const sendWelcomeEmail = async (toEmail: string, userName: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
      <div style="background-color: #ffffff; border-radius: 24px; padding: 48px; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        <center><img src="${LOGO_URL}" alt="Novexis Logo" style="width: 180px; margin-bottom: 40px;"></center>
        
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 24px;">Başarıyla Giriş Yapıldı!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
          Sayın <strong>${userName}</strong>,<br><br>
          Leadnova yönetim panelinize başarıyla giriş yaptınız! Artık deponuzun ve üretim hattınızın tüm kontrolü parmaklarınızın ucunda.
        </p>
        
        <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #1e293b; font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Leadnova ile Neler Yapabilirsiniz?</h3>
          <ul style="color: #475569; font-size: 14px; padding-left: 20px; line-height: 1.8;">
            <li style="margin-bottom: 8px;"><strong>Akıllı İçe Aktarım:</strong> Binlerce ürününüzü Excel üzerinden saniyeler içinde sisteme tanımlayabilirsiniz.</li>
            <li style="margin-bottom: 8px;"><strong>Ürün Ağacı (BOM):</strong> Karmaşık üretim reçetelerinizi oluşturup, tek tıkla üretim firelerinizi yönetebilirsiniz.</li>
            <li style="margin-bottom: 8px;"><strong>Nakit Tuzağı Analizi:</strong> Deponuzda hareketsiz yatan ve nakit akışınızı bozan ürünleri yapay zeka destekli raporlarla anında tespit edebilirsiniz.</li>
            <li style="margin-bottom: 8px;"><strong>Çoklu Şube & Dil:</strong> İşletmeniz büyüdükçe farklı dillerde ve çoklu depo mimarisinde sisteminizi ölçeklendirebilirsiniz.</li>
          </ul>
        </div>
        
        <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 32px;">
          Leadnova olarak, sadece depo yönetimi değil; kurumsal yazılım çözümleri, e-ticaret altyapıları ve siber güvenlik hizmetlerimizle de her zaman yanınızdayız. Vizyonumuzu ve diğer teknoloji çözümlerimizi incelemek için web sitemizi ziyaret edebilirsiniz.
        </p>
        
        <center>
          <a href="https://novexistech.com/" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 18px 36px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px;">
            Leadnova Kurumsal Çözümlerini Keşfedin
          </a>
        </center>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Novexis Tech | Global Technology & ERP
        </p>
      </div>
    </div>
  `;

  return sendMail({
    to: toEmail,
    subject: "Leadnova Panel Girişi Başarılı!",
    html,
  });
};
