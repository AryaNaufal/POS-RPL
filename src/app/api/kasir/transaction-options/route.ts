import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["kasir", "admin"]);

  if (storeIds.length === 0) {
    return NextResponse.json(
      { error: "User belum memiliki akses kasir/admin ke toko aktif." },
      { status: 403 }
    );
  }

  const { data: activeAssignment, error: assignmentError } = await supabase
    .from("stores")
    .select("id, code, name")
    .in("id", storeIds)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (assignmentError) {
    return NextResponse.json({ error: assignmentError.message }, { status: 400 });
  }

  const activeStore = activeAssignment;
  if (!activeStore) {
    return NextResponse.json(
      { error: "User belum memiliki akses kasir/admin ke toko aktif." },
      { status: 403 }
    );
  }

  const [{ data: customers, error: customersError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, code")
        .order("name", { ascending: true })
        .limit(200),
      supabase
        .from("products")
        .select("id, sku, name, sell_price, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(300),
    ]);

  if (customersError || productsError) {
    return NextResponse.json(
      {
        error:
          customersError?.message ??
          productsError?.message ??
          "Gagal memuat opsi transaksi kasir.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: {
      activeStore,
      customers: customers ?? [],
      products: products ?? [],
      paymentMethods: [
        { value: "cash", label: "Cash" },
        { value: "qris", label: "QRIS" },
        { value: "card", label: "Kartu" },
        { value: "transfer", label: "Transfer" },
        { value: "ewallet", label: "E-Wallet" },
      ],
    },
  });
}

