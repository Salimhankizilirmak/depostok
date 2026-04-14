import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from "sonner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leadnova Stok Kontrol",
  description: "Novexis Tech Çok Kiracılı Depo Yönetim Sistemi",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={direction}
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <body className="min-h-full flex flex-col bg-slate-950">
            {children}
            <Toaster position="top-center" richColors />
          </body>
        </NextIntlClientProvider>
      </html>
    </ClerkProvider>
  );
}

