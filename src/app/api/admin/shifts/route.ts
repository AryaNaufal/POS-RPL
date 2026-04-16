import { NextResponse } from "next/server";

const MESSAGE = "Fitur shift kasir detail ditunda pada scope MVP.";

export async function GET() { return NextResponse.json({ error: MESSAGE }, { status: 410 }); }
