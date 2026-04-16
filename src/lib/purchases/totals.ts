import { createServiceClient } from "@/lib/supabase/service";

export async function updatePurchaseTotals(supabase: ReturnType<typeof createServiceClient>, purchaseId: string) {
  const { data: items, error } = await supabase
    .from("purchase_items")
    .select("qty, unit_cost, discount_amount, tax_amount, total")
    .eq("purchase_id", purchaseId);

  if (error || !items) return;

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  items.forEach((item) => {
    subtotal += Number(item.qty) * Number(item.unit_cost);
    discountTotal += Number(item.discount_amount);
    taxTotal += Number(item.tax_amount);
    grandTotal += Number(item.total);
  });

  await supabase
    .from("purchases")
    .update({
      subtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
    })
    .eq("id", purchaseId);
}
