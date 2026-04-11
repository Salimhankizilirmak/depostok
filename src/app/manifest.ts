import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Novexis Stok Kontrol",
    short_name: "Novexis Stok",
    description: "Novexis Tech Çok Kiracılı Depo Yönetim Sistemi",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
