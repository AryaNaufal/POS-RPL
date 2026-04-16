import { NextResponse } from "next/server";

const MESSAGE = "Laporan pembelian ditunda pada scope MVP.";

export async function GET() { return NextResponse.json({ error: MESSAGE }, { status: 410 }); }
