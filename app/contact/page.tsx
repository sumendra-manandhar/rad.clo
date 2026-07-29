"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Check } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend is wired up yet — this opens the user's email client with
    // the message pre-filled. Swap this for a real API call / form service
    // (e.g. Formspree, Resend) when you're ready to go live.
    const subject = encodeURIComponent(`Website inquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:hello@radclo.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-poppins">
      <div className="text-center mb-14">
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Contact
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mt-1">
          Let's talk about your order
        </h1>
        <p className="text-neutral-500 mt-3 max-w-xl mx-auto">
          Questions about bulk orders, custom prints, or an existing order?
          Send us a message and we'll get back to you within 24 hours.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Info cards */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 rounded-xl border border-neutral-200">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 text-sm">Email</p>
              <p className="text-neutral-500 text-sm mt-0.5">hello@radclo.com</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-xl border border-neutral-200">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 text-sm">Phone / WhatsApp</p>
              <p className="text-neutral-500 text-sm mt-0.5">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-xl border border-neutral-200">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 text-sm">Studio</p>
              <p className="text-neutral-500 text-sm mt-0.5">
                Design & print studio — address on request
              </p>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-neutral-900 text-white">
            <p className="font-medium text-sm mb-1">Bulk & corporate orders</p>
            <p className="text-white/70 text-sm">
              Ordering 20+ pieces? Mention the quantity in your message for
              custom pricing.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-600">
              Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              Message
            </label>
            <textarea
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              className="w-full mt-1 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-900 resize-none"
              placeholder="Tell us what you're looking for…"
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white text-sm font-semibold py-3.5 rounded-full hover:bg-neutral-700 transition-colors"
          >
            {sent ? (
              <>
                <Check className="w-4 h-4" /> Opening your email…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
