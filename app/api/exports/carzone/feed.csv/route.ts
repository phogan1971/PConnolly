import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildCarzoneFeedRows, rowsToCsv } from "@/lib/channels/carzone-feed";

export async function GET(req: Request) {
  if (!(await isAuthorised(req))) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const rows = await buildCarzoneFeedRows();
  const csv = rowsToCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dealerops-carzone-feed-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function isAuthorised(req: Request): Promise<boolean> {
  // Either a logged-in admin/manager/office user, or a request carrying the
  // shared CARZONE_FEED_TOKEN (so an approved partner / Motion-side puller can
  // fetch the file). Both are server-side; never exposed to the public.
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-feed-token");
  const expected = process.env.CARZONE_FEED_TOKEN;
  if (expected && token && token === expected) return true;
  const user = await getSessionUser();
  return !!user && ["ADMIN", "MANAGER", "OFFICE"].includes(user.role);
}
