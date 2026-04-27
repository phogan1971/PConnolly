import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildCarzoneFeedRows, rowsToXml } from "@/lib/channels/carzone-feed";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-feed-token");
  const expected = process.env.CARZONE_FEED_TOKEN;
  let ok = false;
  if (expected && token && token === expected) ok = true;
  else {
    const user = await getSessionUser();
    ok = !!user && ["ADMIN", "MANAGER", "OFFICE"].includes(user.role);
  }
  if (!ok) return new NextResponse("Forbidden", { status: 403 });

  const rows = await buildCarzoneFeedRows();
  const xml = rowsToXml(rows);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="dealerops-carzone-feed-${new Date().toISOString().slice(0, 10)}.xml"`,
      "Cache-Control": "no-store",
    },
  });
}
