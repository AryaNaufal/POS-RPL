import { NextResponse } from "next/server";

const MESSAGE = "Fitur pengaturan kompleks ditunda pada scope MVP.";

export async function GET() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ error: MESSAGE }, { status: 410 });
}
