import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { buildTicketQrPayload } from "@/lib/qr";

let cachedLogo: Buffer | null = null;

/**
 * Gmail blocks `<img src="data:...">` for security, so images can't be inlined
 * as base64 data URIs. Instead, we send them as CID (Content-ID) attachments
 * via Resend — the raw PNG bytes ride along in the MIME envelope and the HTML
 * refers to each with `src="cid:<id>"`.
 */
export function getLogoPngBuffer(): Buffer {
  if (cachedLogo) return cachedLogo;
  cachedLogo = fs.readFileSync(path.join(process.cwd(), "public", "images", "logo.png"));
  return cachedLogo;
}

export async function getTicketQrPngBuffer(ticketId: string): Promise<Buffer> {
  return QRCode.toBuffer(buildTicketQrPayload(ticketId), {
    margin: 1,
    width: 320,
    type: "png",
  });
}
