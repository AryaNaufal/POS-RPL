import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      "*, stores(id, name), customers(id, name), cashier:cashier_id(id, name, email), sale_items(*), sale_payments(*)"
    )
    .eq("id", saleId)
    .single();

  if (error || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  return NextResponse.json({ data: sale });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    status?: "completed";
    note?: string | null;
  } | null;

  const supabase = createServiceClient();
  const { data: sale, error: fetchError } = await supabase
    .from("sales")
    .select("store_id, status")
    .eq("id", saleId)
    .single();

  if (fetchError || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (body?.status && body.status !== "completed") {
    return NextResponse.json({ error: "Status transaksi tidak valid untuk scope MVP." }, { status: 400 });
  }

  const updateData: { note?: string | null; status?: "completed" } = {};
  if (body?.note !== undefined) updateData.note = body.note;
  if (body?.status !== undefined) updateData.status = "completed";

  const { data: updatedSale, error: updateError } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", saleId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "sale.update",
    entityType: "sales",
    entityId: saleId,
    beforeData: sale,
    afterData: updatedSale,
  });

  return NextResponse.json({ data: updatedSale });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: sale, error: fetchError } = await supabase
    .from("sales")
    .select("store_id, status")
    .eq("id", saleId)
    .single();

  if (fetchError || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (sale.status !== "draft") {
    return NextResponse.json({ error: "Hanya transaksi draft yang dapat dihapus." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "sale.delete",
    entityType: "sales",
    entityId: saleId,
    beforeData: sale,
  });

  return NextResponse.json({ message: "Transaksi draft berhasil dihapus" });
}
