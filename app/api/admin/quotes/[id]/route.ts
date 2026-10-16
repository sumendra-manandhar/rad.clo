import { requireAdmin } from "@/lib/server/auth";
import { store, type QuotePatch } from "@/lib/server/store";
import { QUOTE_STATUSES, type QuoteStatus } from "@/lib/types";

export async function PATCH(req: Request, ctx: RouteContext<"/api/admin/quotes/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; note?: string };
  const patch: QuotePatch = {};
  if (body.status) {
    if (!QUOTE_STATUSES.includes(body.status as QuoteStatus)) {
      return Response.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = body.status as QuoteStatus;
  }
  if (typeof body.note === "string") patch.note = body.note.slice(0, 1000);
  const quote = await store.updateQuote(id, patch);
  if (!quote) return Response.json({ error: "Quote not found." }, { status: 404 });
  return Response.json(quote);
}
