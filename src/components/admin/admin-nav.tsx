"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { 
  LayoutDashboard, 
  Users, 
  Store, 
  UserCircle, 
  Truck, 
  Tags, 
  Package, 
  Box, 
  ShoppingCart, 
  ClipboardList, 
  Database, 
  BarChart3 
} from "lucide-react";

const menus = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "User & Role", icon: Users },
  { href: "/dashboard/admin/stores", label: "Master Toko", icon: Store },
  { href: "/dashboard/admin/customers", label: "Master Customer", icon: UserCircle },
  { href: "/dashboard/admin/suppliers", label: "Master Supplier", icon: Truck },
  { href: "/dashboard/admin/product-categories", label: "Kategori Produk", icon: Tags },
  { href: "/dashboard/admin/product-units", label: "Satuan Produk", icon: Package },
  { href: "/dashboard/admin/products", label: "Master Produk", icon: Box },
  { href: "/dashboard/admin/sales", label: "Penjualan", icon: ShoppingCart },
  { href: "/dashboard/admin/purchases", label: "Pembelian", icon: ClipboardList },
  { href: "/dashboard/admin/inventory", label: "Stok & Inventori", icon: Database },
  { href: "/dashboard/admin/reports", label: "Laporan", icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {menus.map((menu) => {
        const isActive =
          pathname === menu.href ||
          (menu.href !== "/dashboard/admin" && pathname.startsWith(`${menu.href}/`));

        const Icon = menu.icon;

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-tighter transition-all",
              isActive
                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                : "text-muted-foreground hover:bg-white hover:text-primary hover:shadow-sm"
            )}
          >
            <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
            {menu.label}
          </Link>
        );
      })}
    </nav>
  );
}

