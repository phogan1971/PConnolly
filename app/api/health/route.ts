import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, mode: "demo", time: new Date().toISOString() });
}
