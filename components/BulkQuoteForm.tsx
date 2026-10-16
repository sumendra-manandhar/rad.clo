"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { QUOTE_BUDGETS, QUOTE_PURPOSES } from "@/lib/types";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  organisation: "",
  purpose: "",
  garment: "",
  quantity: "",
  neededBy: "",
  budget: "",
  message: "",
  website: "", // honeypot
};

/** Bulk-order quote request: quantity, date needed and budget. Saved to Admin → Quotes. */
export default function BulkQuoteForm({ garments }: { garments: string[] }) {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Local date, so the earliest pick is today in Nepal, not in UTC.
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
    }).catch(() => null);
    if (!res?.ok) {
      setError((await res?.json().catch(() => null))?.error || "Something went wrong. Please try again.");
      setState("idle");
      return;
    }
    setState("sent");
    setForm(EMPTY);
  };

  const input = "w-full mt-1.5 rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-ink";
  const label = "block text-xs font-medium text-muted";

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-white border border-line p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-lime mx-auto flex items-center justify-center">
          <Check className="w-6 h-6" />
        </div>
        <p className="font-display text-2xl font-bold mt-4">Quote request sent</p>
        <p className="text-sm text-muted mt-2">We&apos;ll call or WhatsApp you within 24 hours with pricing and a mock-up plan.</p>
        <button onClick={() => setState("idle")} className="mt-6 text-sm font-semibold underline">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white border border-line p-6 sm:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className={label}>
          Name
          <input required value={form.name} onChange={set("name")} className={input} placeholder="Your full name" autoComplete="name" />
        </label>
        <label className={label}>
          Phone / WhatsApp
          <input required type="tel" value={form.phone} onChange={set("phone")} className={input} placeholder="98XXXXXXXX" autoComplete="tel" />
        </label>
        <label className={label}>
          Email (optional)
          <input type="email" value={form.email} onChange={set("email")} className={input} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className={label}>
          College, team or company (optional)
          <input value={form.organisation} onChange={set("organisation")} className={input} placeholder="e.g. KU Futsal Club" />
        </label>
      </div>

      <label className={label}>
        What&apos;s it for?
        <select required value={form.purpose} onChange={set("purpose")} className={input}>
          <option value="" disabled>
            Choose one…
          </option>
          {QUOTE_PURPOSES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className={label}>
          Quantity
          <input required type="number" min={20} max={100000} inputMode="numeric" value={form.quantity} onChange={set("quantity")} className={input} placeholder="e.g. 50" />
        </label>
        <label className={label}>
          Date needed
          <input required type="date" min={today} value={form.neededBy} onChange={set("neededBy")} className={input} />
        </label>
        <label className={label}>
          Budget
          <select required value={form.budget} onChange={set("budget")} className={input}>
            <option value="" disabled>
              Choose…
            </option>
            {QUOTE_BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={label}>
        Garment
        <select value={form.garment} onChange={set("garment")} className={input}>
          <option value="">Not sure yet</option>
          {garments.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>

      <label className={label}>
        Details (optional)
        <textarea
          rows={4}
          value={form.message}
          onChange={set("message")}
          className={`${input} resize-none`}
          placeholder="Colours, print spots (front / back / sleeves), names & numbers, size split…"
        />
      </label>

      {/* Honeypot — hidden from people, bots fill it in */}
      <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full flex items-center justify-center gap-2 bg-ink text-paper font-semibold py-4 rounded-full hover:bg-flame transition-colors disabled:opacity-60"
      >
        {state === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Get my bulk quote
          </>
        )}
      </button>
      <p className="text-xs text-muted text-center">Bulk pricing starts at 20 pieces. No payment needed to get a quote.</p>
    </form>
  );
}
