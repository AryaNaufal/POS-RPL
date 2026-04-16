import { NextResponse } from "next/server";

const MESSAGE = "Laporan laba kotor detail ditunda pada scope MVP.";

export async function GET() { return NextResponse.json({ error: MESSAGE }, { status: 410 }); }
