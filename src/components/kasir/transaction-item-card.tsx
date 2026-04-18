import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/entities/product";

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type TransactionItemCardProps = {
  product: Product;
  qty: number;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function TransactionItemCard({
  product,
  qty,
  onQtyChange,
  onRemove,
  disabled = false,
}: TransactionItemCardProps) {
  const unitPrice = Number(product.sell_price ?? 0);
  const subtotal = unitPrice * qty;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="grid gap-4 p-4 sm:grid-cols-[88px_1fr_auto] sm:items-center">
        <img
          src={product.image_url || PLACEHOLDER_IMAGE_URL}
          alt={product.name}
          className="h-[88px] w-[88px] rounded-2xl border border-border/40 object-cover"
        />

        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {product.sku}
            </p>
            <p className="truncate text-base font-black uppercase tracking-tight text-foreground">
              {product.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <p className="font-bold text-primary">{formatRupiah(unitPrice)}</p>
            <p className="text-muted-foreground">
              Subtotal: <span className="font-black text-foreground">{formatRupiah(subtotal)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:min-w-[170px]">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
              disabled={disabled}
              aria-label={`Kurangi qty ${product.name}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(event) => onQtyChange(Math.max(1, Number(event.target.value) || 1))}
              disabled={disabled}
              className="h-10 w-20 rounded-xl text-center font-bold"
              aria-label={`Qty ${product.name}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => onQtyChange(qty + 1)}
              disabled={disabled}
              aria-label={`Tambah qty ${product.name}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="justify-center rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onRemove}
            disabled={disabled}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Item
          </Button>
        </div>
      </div>
    </div>
  );
}
