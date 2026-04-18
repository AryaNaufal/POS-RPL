"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, PackageSearch } from "lucide-react";
import { ManagementModal } from "@/components/admin/management-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/entities/product";
import { ProductPickerCard } from "@/components/kasir/product-picker-card";

type ProductPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
};

export function ProductPickerModal({
  open,
  onOpenChange,
  products,
  onSelectProduct,
}: ProductPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setKeyword("");
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => window.clearTimeout(timer);
  }, [open]);

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return products;

    return products.filter((product) => {
      const haystack = `${product.name} ${product.sku}`.toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [keyword, products]);

  return (
    <ManagementModal open={open} onOpenChange={onOpenChange} className="max-w-6xl">
      <Card className="max-h-[90vh] overflow-hidden border-white/80 bg-white/95 shadow-2xl">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                Pilih Produk
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cari produk lalu pilih langsung dari grid agar transaksi lebih cepat.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Tutup modal produk"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari nama produk atau SKU..."
              className="h-11 rounded-xl border-border/60 pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(90vh-170px)] overflow-y-auto p-5">
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-secondary/20 px-6 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/70" />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-foreground">
                Produk Tidak Ditemukan
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Coba kata kunci lain. Pencarian membaca nama produk dan SKU yang sudah dimuat di halaman transaksi.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductPickerCard
                  key={product.id}
                  product={product}
                  onSelect={(selectedProduct) => {
                    onSelectProduct(selectedProduct);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ManagementModal>
  );
}
