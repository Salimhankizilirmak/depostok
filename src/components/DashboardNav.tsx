"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Ürünler" },
  { href: "/dashboard/history", label: "Stok Geçmişi" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {links.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
              isActive
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
