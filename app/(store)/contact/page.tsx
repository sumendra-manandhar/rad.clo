"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", qty: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Opens the visitor's email client with the message pre-filled.
    const subject = encodeURIComponent(`Website enquiry from ${form.name}`);
    const body = encodeURIComponent(
      `${form.message}\n\nQuantity: ${form.qty || "—"}\n— ${form.name} (${form.email})`
    );
    window.location.href = `mailto:hello@radclo.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const input = "w-full mt-1.5 rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-ink";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Contact</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mt-2">Let&apos;s print something.</h1>
        <p className="text-muted mt-4">
          Bulk orders, team uniforms, event merch or a question about an existing order — we reply within 24 hours.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.3fr] gap-10">
        <div className="space-y-3">
          {[
            { Icon: Mail, title: "Email", text: "hello@radclo.com" },
            { Icon: Phone, title: "Phone / WhatsApp", text: "+91 98765 43210" },
            { Icon: MapPin, title: "Studio", text: "Design & print studio — address on request" },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-line">
              <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-muted text-sm mt-0.5">{text}</p>
              </div>
            </div>
          ))}
          <div className="p-6 rounded-2xl bg-lime">
            <p className="font-display text-xl font-bold">Bulk & corporate orders</p>
            <p className="text-sm mt-1">Ordering 20+ pieces? Tell us the quantity for tiered pricing and free design help.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-line p-6 sm:p-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-xs font-medium text-muted">
              Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Your full name" />
            </label>
            <label className="text-xs font-medium text-muted">
              Email
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="you@example.com" />
            </label>
          </div>
          <label className="block text-xs font-medium text-muted">
            Approx. quantity (optional)
            <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className={input} placeholder="e.g. 50 tees" />
          </label>
          <label className="block text-xs font-medium text-muted">
            Message
            <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${input} resize-none`} placeholder="Tell us what you're looking for…" />
          </label>
          <button type="submit" className="w-full flex items-center justify-center gap-2 bg-ink text-paper font-semibold py-4 rounded-full hover:bg-flame transition-colors">
            {sent ? <><Check className="w-4 h-4" /> Opening your email…</> : <><Send className="w-4 h-4" /> Send message</>}
          </button>
        </form>
      </div>
    </div>
  );
}
