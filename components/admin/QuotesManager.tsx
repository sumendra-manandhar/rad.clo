"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Mail, Phone, MessageCircle } from "lucide-react";
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from "@/lib/types";
import { PageHeader, inputCls } from "@/components/admin/ui";

const STATUS_STYLE: Record<QuoteStatus, string> = {
  new: "bg-lime text-ink",
  contacted: "bg-sky-100 text-sky-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-neutral-200 text-neutral-600",
};

/** WhatsApp link for a customer's number; 10-digit Nepali mobiles get +977. */
function whatsappFor(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("9")) d = `977${d}`;
  return d.length >= 10 ? `https://wa.me/${d}` : "";
}

function daysUntil(date: string) {
  const ms = new Date(`${date}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / 86400000);
}

export default function QuotesManager({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const list = quotes.filter((q) => status === "all" || q.status === status);
  const count = (s: string) => (s === "all" ? quotes.length : quotes.filter((q) => q.status === s).length);

  const update = async (q: Quote, patch: { status?: string; note?: string }) => {
    setSaving(q.id);
    const res = await fetch(`/api/admin/quotes/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(null);
    if (!res.ok) return alert((await res.json()).error || "Update failed");
    router.refresh();
  };

  return (
    <>
      <PageHeader title="Bulk quotes" sub={`${quotes.length} request(s) from the contact page`} />

      <div className="flex gap-1 bg-white border border-line rounded-xl p-1 overflow-x-auto mb-6 w-fit max-w-full">
        {["all", ...QUOTE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${status === s ? "bg-ink text-paper" : "hover:bg-paper"}`}
          >
            {s} <span className="opacity-50">{count(s)}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-20 text-center text-sm text-muted">No quote requests here yet.</div>
      ) : (
        <ul className="grid xl:grid-cols-2 gap-4">
          {list.map((q) => {
            const days = daysUntil(q.neededBy);
            const wa = whatsappFor(q.phone);
            return (
              <li key={q.id} className="rounded-2xl bg-white border border-line p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {q.name}
                      {q.organisation && <span className="text-muted font-normal"> · {q.organisation}</span>}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {q.purpose} · received{" "}
                      {new Date(q.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${STATUS_STYLE[q.status]}`}>
                    {q.status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <Fact label="Quantity" value={`${q.quantity} pcs`} />
                  <Fact label="Garment" value={q.garment} />
                  <Fact label="Budget" value={q.budget} />
                  <Fact
                    label="Needed by"
                    value={new Date(`${q.neededBy}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    hint={days < 0 ? "date passed" : days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}
                    urgent={days >= 0 && days <= 7}
                  />
                </dl>

                {q.message && <p className="text-sm bg-paper rounded-xl p-3 whitespace-pre-line">{q.message}</p>}

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <a href={`tel:${q.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 hover:border-ink">
                    <Phone className="w-3.5 h-3.5" /> {q.phone}
                  </a>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] text-white px-3 py-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {q.email && (
                    <a href={`mailto:${q.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 hover:border-ink">
                      <Mail className="w-3.5 h-3.5" /> {q.email}
                    </a>
                  )}
                </div>

                <div className="grid sm:grid-cols-[10rem_1fr] gap-3 mt-auto">
                  <select
                    value={q.status}
                    disabled={saving === q.id}
                    onChange={(e) => update(q, { status: e.target.value })}
                    className={`${inputCls} capitalize`}
                    aria-label="Status"
                  >
                    {QUOTE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <NoteBox quote={q} saving={saving === q.id} onSave={(note) => update(q, { note })} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Fact({ label, value, hint, urgent }: { label: string; value: string; hint?: string; urgent?: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 ${urgent ? "bg-amber-50 ring-1 ring-amber-200" : "bg-paper"}`}>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
        {label === "Needed by" && <CalendarDays className="w-3 h-3" />} {label}
      </dt>
      <dd className="font-semibold mt-0.5 leading-tight">{value}</dd>
      {hint && <dd className={`text-[11px] ${urgent ? "text-amber-800 font-semibold" : "text-muted"}`}>{hint}</dd>}
    </div>
  );
}

function NoteBox({ quote, onSave, saving }: { quote: Quote; onSave: (n: string) => void; saving: boolean }) {
  const [note, setNote] = useState(quote.note ?? "");
  const dirty = note !== (quote.note ?? "");
  return (
    <div className="flex gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (price quoted, follow-up…)" className={inputCls} />
      {dirty && (
        <button type="button" disabled={saving} onClick={() => onSave(note)} className="shrink-0 text-xs font-semibold bg-ink text-paper px-3 rounded-xl">
          Save
        </button>
      )}
    </div>
  );
}
