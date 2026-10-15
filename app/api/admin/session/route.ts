import { checkPassword, clearSessionCookie, setSessionCookie, adminPassword } from "@/lib/server/auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!adminPassword()) {
    return Response.json({ error: "ADMIN_PASSWORD is not set on the server." }, { status: 503 });
  }
  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }
  await setSessionCookie();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
