import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) {
    return NextResponse.json({ error: "Akses store tidak ditemukan" }, { status: 403 });
  }

  const [{ data: categories, error: categoriesError }, { data: units, error: unitsError }, { data: stores, error: storesError }] =
    await Promise.all([
      supabase
        .from("product_categories")
        .select("id, name, code, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("product_units").select("id, name, symbol").order("name", { ascending: true }),
      supabase
        .from("stores")
        .select("id, name, code")
        .eq("is_active", true)
        .in("id", storeIds)
        .order("name", { ascending: true }),
    ]);

  if (categoriesError || unitsError || storesError) {
    return NextResponse.json(
      {
        error:
          categoriesError?.message ??
          unitsError?.message ??
          storesError?.message ??
          "Gagal memuat opsi master produk",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: {
      categories: categories ?? [],
      units: units ?? [],
      stores: stores ?? [],
    },
  });
}

