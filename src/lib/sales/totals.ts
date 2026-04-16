import { createServiceClient } from "@/lib/supabase/service";

export async function updateSaleTotals(supabase: ReturnType<typeof createServiceClient>, saleId: string) {
  const { data: items, error } = await supabase
    .from("sale_items")
    .select("qty, unit_price, discount_amount, tax_amount, total")
    .eq("sale_id", saleId);

  if (error || !items) return;

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  items.forEach((item) => {
    subtotal += Number(item.qty) * Number(item.unit_price);
    discountTotal += Number(item.discount_amount);
    taxTotal += Number(item.tax_amount);
    grandTotal += Number(item.total);
  });

  await supabase
    .from("sales")
    .update({
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      paid_total: grandTotal, // Assuming for draft/completed we sync paid_total for now
    })
    .eq("id", saleId);
}

