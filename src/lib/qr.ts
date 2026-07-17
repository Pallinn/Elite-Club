import crypto from "node:crypto";

function sign(ticketId: string): string {
  return crypto
    .createHmac("sha256", process.env.TICKET_QR_SECRET ?? "")
    .update(ticketId)
    .digest("hex");
}

export function buildTicketQrPayload(ticketId: string): string {
  return `${ticketId}.${sign(ticketId)}`;
}

export function verifyTicketQrPayload(payload: string): { valid: boolean; ticketId?: string } {
  const [ticketId, signature] = payload.split(".");
  if (!ticketId || !signature) return { valid: false };

  const expected = sign(ticketId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  return valid ? { valid: true, ticketId } : { valid: false };
}
