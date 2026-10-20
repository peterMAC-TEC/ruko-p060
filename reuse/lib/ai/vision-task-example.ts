import "server-only";
import { nanoid } from "nanoid";
import { z } from "zod";
import { rupees } from "../../money";
import type { Charge, Line } from "../../types";
import { runTask } from "../index";
import type { AiImage } from "../provider";

const BillReply = z.object({
  isBill: z.boolean().describe("false if the image is not a restaurant or bar bill, or is unreadable"),
  venueName: z.string().describe("Restaurant or bar name as printed, or empty"),
  items: z.array(
    z.object({
      name: z.string().describe("Item name as printed, tidied (no codes)"),
      quantity: z.number().int().describe("Quantity as printed; 1 if not shown"),
      unitPrice: z.number().nullable().describe("The printed rate per unit in rupees, or null if the bill doesn't show one"),
      amount: z.number().describe("The printed line amount in rupees for all units of this line (not the unit rate)"),
      bucket: z.enum(["alcohol", "non_alcohol"]),
      diet: z.enum(["veg", "non_veg", "na"]).describe("na for drinks"),
      sharedLikely: z.boolean().describe("true for starters, platters, nachos, fries and other dishes groups usually share"),
    }),
  ),
  charges: z.array(
    z.object({
      label: z.string().describe("As printed, e.g. 'CGST 2.5%'"),
      amount: z.number().describe("Rupees as printed; negative for discounts and negative round-offs"),
      kind: z.enum(["tax", "service_charge", "discount", "other"]),
      appliesTo: z.enum(["alcohol", "non_alcohol", "all"]),
    }),
  ),
  printedTotal: z.number().nullable().describe("The final grand total printed on the bill in rupees, or null if not visible"),
});

export type BillReply = z.infer<typeof BillReply>;

const PROMPT = `Read this Indian restaurant or bar bill into line items and charges.

Rules:
- Copy numbers exactly as printed. Never add, multiply or calculate anything yourself.
- Each item's amount is the printed amount for the whole line, not the unit rate. If a rate per unit is printed, copy it into unitPrice.
- bucket: beer, wine, spirits, cocktails and other liquor are "alcohol"; food, mocktails, soft drinks, water and everything else are "non_alcohol".
- diet: "veg" or "non_veg" for food (chicken, mutton, fish, prawn, egg and meat are non_veg); "na" for drinks.
- Charges are everything below the items: CGST and SGST apply to "non_alcohol" (GST does not apply to liquor); VAT or excise on liquor applies to "alcohol"; service charge applies to "all"; discounts are kind "discount" with a negative amount; "Round off" is kind "other", applies to "all", with its printed sign.
- Do not list the subtotal or the grand total as a charge. Put the grand total in printedTotal.
- If something is cut off or unreadable, leave it out rather than guessing.`;

export interface ParsedBill {
  isBill: boolean;
  venueName: string;
  lines: Omit<Line, "tabId">[];
  charges: Omit<Charge, "tabId">[];
  printedTotal: number | null; // paise
}

/** "KF PREMIUM PINT" → "Kf Premium Pint"; leaves mixed-case names alone. */
function tidy(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed !== trimmed.toUpperCase() || !/[A-Z]/.test(trimmed)) return trimmed;
  return trimmed.toLowerCase().replace(/(^|[\s(/-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Model reply (rupees) → our data (integer paise, ids). */
export function toParsedBill(reply: BillReply): ParsedBill {
  return {
    isBill: reply.isBill,
    venueName: tidy(reply.venueName),
    lines: reply.items
      .filter((i) => i.name.trim() && i.amount > 0)
      .map((i) => ({
        id: nanoid(8),
        name: tidy(i.name),
        quantity: Math.max(1, Math.round(i.quantity)),
        amount: rupees(i.amount),
        unitPrice: i.unitPrice === null || i.unitPrice <= 0 ? null : rupees(i.unitPrice),
        bucket: i.bucket,
        diet: i.bucket === "alcohol" ? "na" : i.diet,
        sharedLikely: i.sharedLikely,
      })),
    charges: reply.charges
      .filter((c) => c.label.trim() && c.amount !== 0)
      .map((c) => ({
        id: nanoid(8),
        label: c.label.trim(),
        amount: c.kind === "discount" ? -Math.abs(rupees(c.amount)) : rupees(c.amount),
        kind: c.kind,
        appliesTo: c.appliesTo,
      })),
    printedTotal: reply.printedTotal === null ? null : rupees(reply.printedTotal),
  };
}

export async function parseBill(image: AiImage): Promise<ParsedBill> {
  return toParsedBill(await runTask(BillReply, { prompt: PROMPT, images: [image] }));
}
