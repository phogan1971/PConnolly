import { NextResponse } from "next/server";
import { authenticate, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await authenticate(email, password);
  if (!user) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 303 });
  }
  await setSession(user.id);
  return NextResponse.redirect(new URL("/admin/dashboard", req.url), { status: 303 });
}
