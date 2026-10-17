import type { OrderStatus } from "@/lib/types";

// Tracking IDs look like RC-7K3P-9QX2: no 0/O/1/I, so they're easy to read
// out over the phone or type from a WhatsApp message.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newTrackCode(random: (n: number) => number) {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[random(ALPHABET.length)]).join("");
  return `RC-${pick(4)}-${pick(4)}`;
}

/** Tidies what a customer typed ("rc 7k3p9qx2" → "RC-7K3P-9QX2"). */
export function normaliseTrackCode(input: string) {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^RC/, "");
  return s.length === 8 ? `RC-${s.slice(0, 4)}-${s.slice(4)}` : null;
}

/** The customer-facing progress steps, in order. */
export const TRACK_STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "pending", label: "Order received", hint: "We'll call or WhatsApp you to confirm the design and payment." },
  { status: "confirmed", label: "Confirmed", hint: "Design and payment confirmed. Your order is in the queue." },
  { status: "printing", label: "Printing", hint: "Your tees are being printed and checked." },
  { status: "shipped", label: "On the way", hint: "Packed and handed to delivery." },
  { status: "delivered", label: "Delivered", hint: "Enjoy your new tee!" },
];

/** Index of the current step (-1 for cancelled). */
export const stepIndex = (status: OrderStatus) => TRACK_STEPS.findIndex((s) => s.status === status);
