import { NextResponse } from "next/server";

const MESSAGE = "Fitur audit log penuh ditunda pada scope MVP.";

export async function GET() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}
