import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds, hasStoreAccess } from "@/lib/auth/store-scope";
import type { CreateExpenseInput } from "@/types/forms/expense-form";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const category = searchParams.get("category");

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin", "owner"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  if (storeId && !storeIds.includes(storeId)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("expenses")
    .select("*, stores(id, name), paid_by_user:paid_by(id, name)")
    .order("expense_date", { ascending: false });

  query = storeId ? query.eq("store_id", storeId) : query.in("store_id", storeIds);
  if (dateFrom) query = query.gte("expense_date", dateFrom);
  if (dateTo) query = query.lte("expense_date", dateTo);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as CreateExpenseInput | null;

  if (!body?.store_id || !body?.category || !body?.amount || !body?.description) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.store_id, ["admin", "owner"]);
  if (!canAccessStore) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      store_id: body.store_id,
      category: body.category.trim(),
      description: body.description.trim(),
      amount: Number(body.amount),
      expense_date: body.expense_date || new Date().toISOString().split("T")[0],
      paid_by: auth.session.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}
