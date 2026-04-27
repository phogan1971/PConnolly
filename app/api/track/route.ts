import { NextResponse } from "next/server";

// Demo mode: tracking events are accepted but not persisted.
export async function POST() {
  return NextResponse.json({ ok: true });
}
