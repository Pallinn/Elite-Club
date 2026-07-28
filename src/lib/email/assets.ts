import fs from "node:fs";
import path from "node:path";

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
