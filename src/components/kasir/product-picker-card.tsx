import type { Product } from "@/types/entities/product";

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type ProductPickerCardProps = {
  product: Product;
  onSelect: (product: Product) => void;
};

export function ProductPickerCard({ product, onSelect }: ProductPickerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary/20">
        <img
          src={product.image_url || PLACEHOLDER_IMAGE_URL}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {product.sku}
          </p>
          <p className="line-clamp-2 min-h-10 text-sm font-black uppercase tracking-tight text-foreground">
            {product.name}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <p className="text-sm font-black text-primary">
            {formatRupiah(Number(product.sell_price ?? 0))}
          </p>
          <span className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary-foreground">
            Pilih
          </span>
        </div>
      </div>
    </button>
  );
}
