import type { ReactNode } from "react";

// Bu kök layout, Next.js App Router'ın boot edebilmesi için gereklidir.
// Gerçek HTML ve body etiketleri [locale]/layout.tsx içinde tanımlıdır.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
