import { NextResponse } from "next/server";

const MESSAGE = "Fitur stock opname ditunda pada scope MVP.";

export async function GET() { return NextResponse.json({ error: MESSAGE }, { status: 410 }); }
export async function POST() { return NextResponse.json({ error: MESSAGE }, { status: 410 }); }
