import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST(req: Request) {
  void req;
  await clearSession();
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
