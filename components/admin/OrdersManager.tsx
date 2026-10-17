"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Phone, Mail, MapPin, Search } from "lucide-react";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/garments";
import { areaSize, describePlacement, getLocation, placementFrame, toGuideBox } from "@/lib/print-locations";
import PositionGuide from "@/components/PositionGuide";
import { PageHeader, StatusBadge, inputCls } from "@/components/admin/ui";

export default function OrdersManager({
  orders,
  initialStatus,
  initialOpen,
  initialQuery,
}: {
  orders: Order[];
  initialStatus?: string;
  initialOpen?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(
    initialStatus && ORDER_STATUSES.includes(initialStatus as OrderStatus) ? initialStatus : "all"
  );
  const [q, setQ] = useState(initialQuery ?? "");
  const [open, setOpen] = useState<string | null>(initialOpen ?? null);
  const [saving, setSaving] = useState<string | null>(null);

  const list = orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      (!q ||
        String(o.number).includes(q) ||
        (o.trackCode ?? "").toLowerCase().includes(q.toLowerCase().trim()) ||
        o.customer.name.toLowerCase().includes(q.toLowerCase()) ||
        o.customer.phone.includes(q))
  );

  const update = async (o: Order, patch: { status?: string; note?: string }) => {
    setSaving(o.id);
    const res = await fetch(`/api/admin/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(null);
    if (!res.ok) return alert((await res.json()).error || "Update failed");
    router.refresh();
  };

  const count = (s: string) => (s === "all" ? orders.length : orders.filter((o) => o.status === s).length);

  return (
    <>
      <PageHeader title="Orders" sub={`${orders.length} total`} />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order #, tracking ID, name or phone" className={`${inputCls} pl-10`} />
        </div>
        <div className="flex gap-1 bg-white border border-line rounded-xl p-1 overflow-x-auto">
          {["all", ...ORDER_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${status === s ? "bg-ink text-paper" : "hover:bg-paper"}`}
            >
              {s} <span className="opacity-50">{count(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line py-20 text-center text-sm text-muted">No orders here yet.</div>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const isOpen = open === o.id;
            return (
              <li key={o.id} className="rounded-2xl bg-white border border-line overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : o.id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-paper/60">
                  <span className="flex flex-col">
                    <span className="font-mono font-semibold">#{o.number}</span>
                    {o.trackCode && <span className="font-mono text-[10px] text-muted">{o.trackCode}</span>}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{o.customer.name}</span>
                    <span className="block text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                      {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
                    </span>
                  </span>
                  <StatusBadge status={o.status} />
                  <span className="font-semibold w-20 text-right hidden sm:block">{formatPrice(o.total)}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-line p-4 sm:p-6 grid xl:grid-cols-[1.8fr_1fr] gap-6">
                    <ul className="space-y-4">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="rounded-2xl border border-line p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                            <p className="font-semibold">
                              {it.qty} × {it.garmentLabel} — {it.size}
                            </p>
                            <p className="text-muted flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: it.color }} />
                              {it.colorLabel} · {formatPrice(it.unitPrice)} each ·{" "}
                              <strong className="text-ink">{formatPrice(it.unitPrice * it.qty)}</strong>
                            </p>
                          </div>

                          {it.prints.length === 0 ? (
                            <p className="text-xs text-muted mt-2">Plain — no print</p>
                          ) : (
                            <div className="grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 mt-3">
                              {/* Exactly where the customer placed each design */}
                              <div className="rounded-xl bg-paper p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted text-center mb-2">
                                  Position guide
                                </p>
                                <PositionGuide
                                  readOnly
                                  color={it.color}
                                  layers={it.prints.flatMap((p, i) => {
                                    // New orders: relative to the print area; older ones: the whole piece.
                                    const loc = placementFrame(p);
                                    return loc && p.placement
                                      ? [{ id: String(i), src: p.artworkUrl, aspect: p.aspect || 1, box: toGuideBox(loc, p.placement) }]
                                      : [];
                                  })}
                                />
                                {it.previewUrl && (
                                  <a href={it.previewUrl} target="_blank" className="block mt-2 text-center text-xs font-semibold underline">
                                    View 3D preview
                                  </a>
                                )}
                              </div>

                              <ol className="space-y-2">
                                {it.prints.map((p, i) => {
                                  const loc = getLocation(p.location);
                                  const frame = placementFrame(p);
                                  return (
                                    <li key={i} className="flex gap-3 rounded-xl bg-paper p-2.5">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={p.artworkUrl} alt="" className="w-14 h-14 rounded-lg object-contain bg-white p-1 shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold">
                                          {loc?.label ?? p.location}
                                          {loc && p.v === 2 && <span className="font-normal text-muted"> · {areaSize(loc)} area</span>}
                                        </p>
                                        <p className="text-xs truncate">{p.designName}</p>
                                        {frame && p.placement && (
                                          <p className="text-[11px] text-muted mt-0.5">
                                            {describePlacement(frame, p.placement, p.aspect || 1)}
                                          </p>
                                        )}
                                        <a
                                          href={p.artworkUrl}
                                          download
                                          target="_blank"
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold underline mt-1"
                                        >
                                          <Download className="w-3 h-3" /> Print file
                                        </a>
                                      </div>
                                      {p.price != null && p.price > 0 && (
                                        <span className="text-xs text-muted shrink-0">{formatPrice(p.price)}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ol>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-4 text-sm">
                      <div className="rounded-xl bg-paper p-4 space-y-2">
                        <p className="font-semibold">
                          {o.customer.name}
                          {o.userId && (
                            <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wider bg-white rounded-full px-2 py-0.5">
                              Google account
                            </span>
                          )}
                        </p>
                        {o.trackCode && (
                          <a href={`/track/${o.trackCode}`} target="_blank" className="block text-xs font-mono underline">
                            Tracking page · {o.trackCode}
                          </a>
                        )}
                        <a href={`tel:${o.customer.phone}`} className="flex items-center gap-2 hover:underline">
                          <Phone className="w-3.5 h-3.5" /> {o.customer.phone}
                        </a>
                        {o.customer.email && (
                          <a href={`mailto:${o.customer.email}`} className="flex items-center gap-2 hover:underline">
                            <Mail className="w-3.5 h-3.5" /> {o.customer.email}
                          </a>
                        )}
                        <p className="flex gap-2 whitespace-pre-line">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {o.customer.address}
                        </p>
                      </div>
                      <label className="block">
                        <span className="text-xs font-medium text-muted">Status</span>
                        <select
                          value={o.status}
                          disabled={saving === o.id}
                          onChange={(e) => update(o, { status: e.target.value })}
                          className={`${inputCls} mt-1 capitalize`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NoteBox order={o} onSave={(note) => update(o, { note })} saving={saving === o.id} />
                      <p className="flex justify-between font-display text-xl font-bold pt-2 border-t border-line">
                        <span>Total</span>
                        <span>{formatPrice(o.total)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function NoteBox({ order, onSave, saving }: { order: Order; onSave: (n: string) => void; saving: boolean }) {
  const [note, setNote] = useState(order.note ?? "");
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted">Notes (customer note / internal)</span>
      <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-1 resize-none`} />
      {note !== (order.note ?? "") && (
        <button type="button" disabled={saving} onClick={() => onSave(note)} className="mt-2 text-xs font-semibold bg-ink text-paper px-3 py-1.5 rounded-full">
          Save note
        </button>
      )}
    </label>
  );
}
