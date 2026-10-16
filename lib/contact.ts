// Shop contact details, used by the footer, contact page and chat buttons.
// Fill these in — any channel left empty is simply hidden on the site.

export const CONTACT = {
  /** WhatsApp / Viber number in international format, e.g. "+9779812345678" */
  phone: "",
  /** Facebook page username for Messenger, e.g. "radclo.np" (from facebook.com/radclo.np) */
  facebookPage: "",
  email: "hello@radclo.com",
  /** Nepal's weekend is Saturday */
  hours: "Sun–Fri, 10am–7pm",
};

const digits = CONTACT.phone.replace(/\D/g, "");

/** "+977 981-2345678" style display, or "" when no number is set */
export const phoneDisplay = digits.startsWith("977") && digits.length === 13
  ? `+977 ${digits.slice(3, 6)}-${digits.slice(6)}`
  : CONTACT.phone;

export const whatsappUrl = (text?: string) =>
  digits ? `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}` : "";
export const viberUrl = digits ? `viber://chat?number=%2B${digits}` : "";
export const messengerUrl = CONTACT.facebookPage ? `https://m.me/${CONTACT.facebookPage}` : "";
export const telUrl = digits ? `tel:+${digits}` : "";

export const hasChat = !!(whatsappUrl() || viberUrl || messengerUrl);
