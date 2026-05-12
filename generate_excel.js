const XLSX = require('xlsx');

console.log("Excel dosyaları üretiliyor. Lütfen bekleyin...");

// ==========================================
// 1. KAOS DEPO EXCELİ (Reklamın Başlangıcı İçin)
// ==========================================
const kaosData = [];
// Kasten iğrenç, uzun ve anlamsız başlıklar:
kaosData.push([
    'MALZEME_TANIMI_(SİLMEYİN!)', 
    'GÜNCEL ADET (SAYIM BEKLİYOR!!)', 
    'FİYAT_$_EU_TL_KARISIK', 
    'LOKASYON_DEPO_RAF', 
    'AHMET USTANIN NOTLARI'
]);

for (let i = 1; i <= 8000; i++) {
    const isError = Math.random() > 0.85; // %15 ihtimalle bozuk veri üret
    kaosData.push([
        isError ? `Bilinmeyen Parça / KOD YOK - ${Math.floor(Math.random() * 1000)}` : `Çelik_Profil_${i}_mm_X_Kalite_Fason_Giden`,
        isError ? 'SAYILMADI (EKSİK)' : Math.floor(Math.random() * 5000),
        (Math.random() * 100).toFixed(2) + (isError ? ' ??' : ' TL'),
        isError ? 'DEPO ARKASI KÖŞE' : `Raf-C-${Math.floor(Math.random() * 20)}`,
        isError ? 'Ahmet usta bunu fasona yolladı ama sisteme girmemiş' : ''
    ]);
}

const wb1 = XLSX.utils.book_new();
const ws1 = XLSX.utils.aoa_to_sheet(kaosData);

// Sütun genişliklerini kasten bozuyoruz ki ekranda çirkin dursun
ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 50 }];
XLSX.utils.book_append_sheet(wb1, ws1, 'Sayfa1_Kopya_Final_Gercek');
XLSX.writeFile(wb1, 'Kaos_Depo_Takip_v14_FINAL_SON_KOPYA.xlsx');


// ==========================================
// 2. ÜRÜN AĞACI (BOM) EXCELİ (Şov Bölümü İçin)
// ==========================================
const bomData = [];
bomData.push(['ANA ÜRÜN KODU', 'ANA ÜRÜN ADI', 'ALT BİLEŞEN KODU', 'ALT BİLEŞEN ADI', 'KULLANIM MİKTARI', 'BİRİM']);

const anaUrunler = ["CNC_Torna_Makinesi_X1", "Endüstriyel_Konveyör_Bant", "Lazer_Kesim_Masasi_Pro"];

// Her ana ürün için binlerce alt bileşen üretiyoruz
anaUrunler.forEach((anaUrun, index) => {
    for (let j = 1; j <= 2500; j++) {
        bomData.push([
            `PRD-00${index + 1}`,
            anaUrun,
            `COMP-${index + 1}-${j}`,
            `Somun_Vida_Kablo_Pim_Grup_${j}`,
            (Math.random() * 10).toFixed(2),
            j % 3 === 0 ? 'Metre' : 'Adet'
        ]);
    }
});

const wb2 = XLSX.utils.book_new();
const ws2 = XLSX.utils.aoa_to_sheet(bomData);
ws2['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb2, ws2, 'Urun_Agaci_BOM_Listesi');
XLSX.writeFile(wb2, 'Karmasik_Urun_Agaci_Receteleri.xlsx');

console.log("Dosyalar başarıyla oluşturuldu! Videoda bol şans!");
