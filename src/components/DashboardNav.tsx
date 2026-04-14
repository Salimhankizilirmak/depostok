"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface DashboardNavProps {
  userRole?: string;
}

export default function DashboardNav({ userRole }: DashboardNavProps) {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: t("products") },
    { href: "/dashboard/history", label: t("history") },
    { href: "/dashboard/team", label: t("team") },
    { href: "/dashboard/settings", label: t("settings") },
  ];

  const filteredLinks = links.filter((link) => {
    if (link.href === "/dashboard/team" || link.href === "/dashboard/settings") {
      return userRole === "Yönetici";
    }
    return true;
  });

  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
      <div className="flex items-center gap-1 min-w-max">
        {filteredLinks.map((link) => {
          // We need to handle the locale prefix in the pathname check
          // The links themselves are currently not locale-prefixed in the href
          // but next-intl's Link (if we used it) or our middleware handles redirection.
          // For now, let's keep the logic simple as it's a sub-path within [locale]
          const isActive = pathname.includes(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
