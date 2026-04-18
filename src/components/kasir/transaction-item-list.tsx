import { PackagePlus } from "lucide-react";
import type { Product } from "@/types/entities/product";
import { TransactionItemCard } from "@/components/kasir/transaction-item-card";

type TransactionItem = {
  id: number;
  product_id: string;
  qty: number;
};

type TransactionItemListProps = {
  items: TransactionItem[];
  productMap: Map<string, Product>;
  onQtyChange: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  disabled?: boolean;
};

export function TransactionItemList({
  items,
  productMap,
  onQtyChange,
  onRemove,
  disabled = false,
}: TransactionItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-secondary/20 px-6 text-center">
        <PackagePlus className="h-12 w-12 text-muted-foreground/70" />
        <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-foreground">
          Belum Ada Item Transaksi
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Klik tombol tambah item untuk membuka picker produk dan mulai menyusun transaksi kasir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const product = productMap.get(item.product_id);
        if (!product) return null;

        return (
          <TransactionItemCard
            key={item.id}
            product={product}
            qty={item.qty}
            onQtyChange={(qty) => onQtyChange(item.id, qty)}
            onRemove={() => onRemove(item.id)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}
