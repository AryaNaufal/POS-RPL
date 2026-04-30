"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart } from "lucide-react";

const menus = [
  { href: "/dashboard/kasir", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/transaksi/tambah", label: "Tambah Transaksi", icon: ShoppingCart },
];

export function KasirNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {menus.map((menu) => {
        const isActive =
          pathname === menu.href ||
          (menu.href !== "/dashboard/kasir" && pathname.startsWith(`${menu.href}/`));
        const Icon = menu.icon;

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-tighter transition-all",
              isActive
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]"
                : "text-muted-foreground hover:bg-white hover:text-emerald-700 hover:shadow-sm"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-emerald-700"
              )}
            />
            {menu.label}
          </Link>
        );
      })}
    </nav>
  );
}
