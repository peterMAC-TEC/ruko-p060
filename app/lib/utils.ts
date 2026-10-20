export { cn } from "cn"

/** A WhatsApp chat with this number, message pre-filled (the person still taps Send). Indian 10-digit numbers get +91. */
export function waLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
