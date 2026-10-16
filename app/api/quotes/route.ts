import { store } from "@/lib/server/store";
import { QUOTE_BUDGETS, QUOTE_PURPOSES } from "@/lib/types";

const MIN_QTY = 20;

// Saves a bulk-order quote request from the contact page.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return Response.json({ error: "Invalid request." }, { status: 400 });
  // Honeypot field: real visitors never see or fill it.
  if (typeof b.website === "string" && b.website) return Response.json({ ok: true });

  const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const quantity = Math.floor(Number(b.quantity));
  const neededBy = str(b.neededBy, 10);
  const purpose = str(b.purpose);
  const budget = str(b.budget);

  const quote = {
    name: str(b.name, 120),
    phone: str(b.phone, 30),
    email: str(b.email, 160) || undefined,
    organisation: str(b.organisation, 160) || undefined,
    purpose: (QUOTE_PURPOSES as readonly string[]).includes(purpose) ? purpose : "Other",
    garment: str(b.garment, 80) || "Not sure",
    quantity,
    neededBy,
    budget: (QUOTE_BUDGETS as readonly string[]).includes(budget) ? budget : "Not sure yet",
    message: str(b.message, 2000) || undefined,
  };

  if (!quote.name || !quote.phone) return Response.json({ error: "Please add your name and phone number." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity < MIN_QTY || quantity > 100000) {
    return Response.json({ error: `Bulk quotes start at ${MIN_QTY} pieces.` }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(neededBy) || neededBy < today) {
    return Response.json({ error: "Please pick the date you need the order by." }, { status: 400 });
  }

  try {
    await store.createQuote(quote);
  } catch (err) {
    console.error("[quotes] couldn't save quote:", err);
    return Response.json(
      { error: "Sorry, we couldn't send that right now. Please message us on WhatsApp or try again." },
      { status: 500 }
    );
  }
  return Response.json({ ok: true });
}
