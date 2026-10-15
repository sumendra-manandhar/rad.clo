import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Single-admin auth: the password lives in ADMIN_PASSWORD, and a signed,
// expiring, httpOnly cookie marks the admin as logged in.

export const SESSION_COOKIE = "radclo_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const DEV_PASSWORD = "admin123";

export function adminPassword() {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  if (process.env.NODE_ENV === "production") return null; // refuse logins until it's set
  return DEV_PASSWORD;
}

function secret() {
  return process.env.SESSION_SECRET || `radclo:${adminPassword() ?? "unset"}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  const pw = adminPassword();
  return !!pw && safeEqual(input, pw);
}

export function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i === -1) return false;
  const payload = token.slice(0, i);
  const [, exp] = payload.split(".");
  if (!exp || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(token.slice(i + 1), sign(payload));
}

export async function setSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For route handlers: returns a 401 Response if not logged in, else null. */
export async function requireAdmin() {
  if (await isAdmin()) return null;
  return Response.json({ error: "Not authorised" }, { status: 401 });
}
