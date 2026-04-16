import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";
import type { CreateSaleInput } from "@/types/forms/sale-form";
import type { ApiError, ApiSuccess } from "@/types/common/api";

function buildInvoiceNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}${d}-${random}`;
}

async function createInvoiceNo(supabase: ReturnType<typeof createServiceClient>) {
  for (let i = 0; i < 6; i += 1) {
    const candidate = buildInvoiceNo();
    const { count, error } = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("invoice_no", candidate);
    if (!error && (count ?? 0) === 0) return candidate;
  }
  return `${buildInvoiceNo()}-${Date.now().toString().slice(-4)}`;
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as CreateSaleInput | null;

  if (!body?.store_id || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Payload transaksi tidak valid." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.store_id, [
    "kasir",
    "admin",
    "owner",
  ]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const productIds = [...new Set(body.items.map((item) => item.product_id))];
  const [{ data: products, error: productError }, { data: stocks, error: stockError }] = await Promise.all([
    supabase
      .from("products")
      .select("id, sku, name, sell_price, track_stock, is_active")
      .in("id", productIds),
    supabase
      .from("product_stocks")
      .select("id, product_id, qty_on_hand")
      .eq("store_id", body.store_id)
      .in("product_id", productIds),
  ]);

  if (productError || stockError) {
    return NextResponse.json(
      { error: productError?.message ?? stockError?.message ?? "Gagal memuat data produk/stok." },
      { status: 400 }
    );
  }

  const productMap = new Map((products ?? []).map((product: any) => [product.id, product]));
  const stockMap = new Map((stocks ?? []).map((stock: any) => [stock.product_id, Number(stock.qty_on_hand ?? 0)]));

  for (const item of body.items) {
    const product = productMap.get(item.product_id) as any;
    if (!product || !product.is_active) {
      return NextResponse.json({ error: `Produk ${item.product_id} tidak ditemukan atau nonaktif.` }, { status: 400 });
    }
    if (product.track_stock) {
      const currentQty = stockMap.get(item.product_id) ?? 0;
      if (currentQty < item.qty) {
        return NextResponse.json(
          { error: `Stok tidak cukup untuk produk ${product.name}.` },
          { status: 400 }
        );
      }
    }
  }

  const invoiceNo = await createInvoiceNo(supabase);
  
  // Calculate totals from items for safety
  const calculatedSubtotal = body.items.reduce((total, item) => {
    const product = productMap.get(item.product_id) as any;
    const unitPrice = item.unit_price > 0 ? item.unit_price : Number(product?.sell_price ?? 0);
    return total + unitPrice * item.qty;
  }, 0);

  const discountTotal = Number(body.discount_total || 0);
  const taxTotal = Number(body.tax_total || 0);
  const serviceTotal = Number(body.service_total || 0);
  const grandTotal = calculatedSubtotal - discountTotal + taxTotal + serviceTotal;

  const { data: activeShift } = await supabase
    .from("cashier_shifts")
    .select("id")
    .eq("store_id", body.store_id)
    .eq("cashier_id", auth.session.userId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const saleStatus = body.status || "completed";
  const paidTotal = saleStatus === "draft" ? 0 : grandTotal;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      invoice_no: invoiceNo,
      store_id: body.store_id,
      cashier_id: auth.session.userId,
      customer_id: body.customer_id || null,
      shift_id: activeShift?.id ?? null,
      status: saleStatus,
      subtotal: calculatedSubtotal,
      discount_total: discountTotal,
      tax_total: taxTotal,
      service_total: serviceTotal,
      grand_total: grandTotal,
      paid_total: paidTotal,
      change_total: 0,
      note: body.note?.trim() || null,
    })
    .select("id, status")
    .single();

  if (saleError || !sale) {
    return NextResponse.json({ error: saleError?.message ?? "Gagal membuat transaksi." }, { status: 400 });
  }

  const saleItemsPayload = body.items.map((item) => {
    const product = productMap.get(item.product_id) as any;
    const unitPrice = item.unit_price > 0 ? item.unit_price : Number(product.sell_price ?? 0);
    const rowSubtotal = unitPrice * item.qty;
    const rowTotal = rowSubtotal - Number(item.discount_amount || 0);
    return {
      sale_id: sale.id,
      product_id: product.id,
      product_name: product.name,
      sku_snapshot: product.sku,
      qty: item.qty,
      unit_price: unitPrice,
      discount_amount: Number(item.discount_amount || 0),
      tax_amount: 0,
      subtotal: rowSubtotal,
      total: rowTotal,
    };
  });

  const { error: saleItemsError } = await supabase.from("sale_items").insert(saleItemsPayload);
  if (saleItemsError) {
    return NextResponse.json({ error: saleItemsError.message }, { status: 400 });
  }

  if (sale.status === "completed") {
    if (Array.isArray(body.payments) && body.payments.length > 0) {
      const paymentsPayload = body.payments.map(p => ({
        sale_id: sale.id,
        payment_method: p.payment_method,
        amount: p.amount,
        reference_no: p.reference_no || null,
      }));
      const { error: paymentError } = await supabase.from("sale_payments").insert(paymentsPayload);
      if (paymentError) {
        return NextResponse.json({ error: paymentError.message }, { status: 400 });
      }
    } else {
        // Fallback for missing payments but completed status
        // Should ideally be handled by frontend
    }

    for (const item of body.items) {
      const product = productMap.get(item.product_id) as any;
      if (!product?.track_stock) continue;

      const currentQty = stockMap.get(item.product_id) ?? 0;
      const nextQty = currentQty - item.qty;
      stockMap.set(item.product_id, nextQty);

      const { error: stockUpsertError } = await supabase.from("product_stocks").upsert(
        {
          store_id: body.store_id,
          product_id: item.product_id,
          qty_on_hand: nextQty,
        },
        { onConflict: "product_id,store_id" }
      );

      if (stockUpsertError) {
        return NextResponse.json({ error: stockUpsertError.message }, { status: 400 });
      }

      const { error: movementError } = await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        store_id: body.store_id,
        movement_type: "sale",
        qty: item.qty,
        reference_type: "sale",
        reference_id: sale.id,
        created_by: auth.session.userId,
      });

      if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 400 });
      }
    }
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "sale.create",
    entityType: "sales",
    entityId: sale.id,
    afterData: {
      invoiceNo,
      storeId: body.store_id,
      itemCount: body.items.length,
      grandTotal,
    },
  });

  return NextResponse.json({
    data: {
      saleId: sale.id,
      invoiceNo,
      grandTotal,
    },
  });
}
