import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Lightweight session for the MVP: signed cookie holding the user id.
 * Replace with Auth.js v5 once we wire email magic-link.
 */

const COOKIE_NAME = "dops_session";
const COOKIE_TTL_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is not set or too short. Set it in .env.");
  }
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function pack(userId: string) {
  const sig = sign(userId);
  return `${userId}.${sig}`;
}

function unpack(raw: string | undefined): string | null {
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expected = sign(userId);
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return userId;
}

export async function getSessionUser() {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  const userId = unpack(raw);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/admin/dashboard?denied=1");
  }
  return user;
}

export async function setSession(userId: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, pack(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Sales Manager",
  OFFICE: "Office",
  SALES: "Salesperson",
  VIEWER: "Read-only",
};

export function canEditStock(role: Role) {
  return role === Role.ADMIN || role === Role.MANAGER || role === Role.OFFICE;
}

export function canManageLeads(role: Role) {
  return role === Role.ADMIN || role === Role.MANAGER || role === Role.SALES;
}
