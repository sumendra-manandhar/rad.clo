"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { hasChat, messengerUrl, viberUrl, whatsappUrl } from "@/lib/contact";

// Brand marks, simplified
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3l-.4-.2z" />
  </svg>
);
const ViberIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M12 3c5 0 8 2.2 8 7.5S17 18 12 18l-3 3v-3.3C5.6 16.6 4 14.3 4 10.5 4 5.2 7 3 12 3z" />
    <path d="M9.5 8.5c.6 2 1.8 3.4 3.9 4.2M13 7.5a2.5 2.5 0 0 1 2.3 2.3M13 5.8a4.3 4.3 0 0 1 4 4" />
  </svg>
);
const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
    <path d="M12 2C6.4 2 2 6.1 2 11.7c0 2.9 1.2 5.5 3.2 7.3V22l2.9-1.6c1.2.3 2.5.5 3.9.5 5.6 0 10-4.1 10-9.7S17.6 2 12 2zm1 13-2.5-2.7L5.6 15l5.4-5.7 2.6 2.7 4.8-2.7L13 15z" />
  </svg>
);

/** Floating "Chat with us" button: WhatsApp, Viber and Messenger. Hidden until lib/contact.ts is filled in. */
export default function ChatButtons() {
  const [open, setOpen] = useState(false);
  if (!hasChat) return null;

  const channels = [
    { href: whatsappUrl("Hi Rad.Clo! I have a question about custom printing."), label: "WhatsApp", Icon: WhatsAppIcon, cls: "bg-[#25D366] text-white" },
    { href: viberUrl, label: "Viber", Icon: ViberIcon, cls: "bg-[#7360F2] text-white" },
    { href: messengerUrl, label: "Messenger", Icon: MessengerIcon, cls: "bg-[#0084FF] text-white" },
  ].filter((c) => c.href);

  return (
    <div className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:right-6 md:bottom-6 z-30 flex flex-col items-end gap-2">
      {open &&
        channels.map(({ href, label, Icon, cls }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3 text-sm font-semibold shadow-lg hover:scale-105 transition-transform ${cls}`}
          >
            <Icon /> {label}
          </a>
        ))}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close chat options" : "Chat with us"}
        className="flex items-center gap-2 rounded-full bg-ink text-paper pl-4 pr-5 py-3.5 text-sm font-semibold shadow-xl hover:bg-flame transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5 text-lime" />}
        {open ? "Close" : "Chat with us"}
      </button>
    </div>
  );
}
