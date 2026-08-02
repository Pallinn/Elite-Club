// Slip2Go REST API client (https://slip2go.com/guide).
//
// Auth: "Authorization: Bearer {secretKey}" - confirmed from their own
// JavaScript code sample (the prose on the docs page omits the "Bearer "
// prefix, which caused an "Authentication Token Mismatch" error until this
// was corrected).

export type Slip2GoSlipData = {
  referenceId: string;
  transRef: string;
  dateTime: string;
  // THB, major unit (e.g. 150.5 = 150.50 baht) - per Slip2Go's response docs.
  amount: number;
  ref1: string | null;
  ref2: string | null;
  ref3: string | null;
  sender: { account: { name: string } };
  receiver: {
    account: {
      name: string;
      // Masked (e.g. "xxx-x-x5366-x") - not usable for exact matching, but
      // present for audit/debugging.
      proxy?: { type: string; account: string } | null;
      bank?: { account: string } | null;
    };
    bank: { id: string; name: string };
  };
};

export type Slip2GoResult =
  | { ok: true; data: Slip2GoSlipData }
  | { ok: false; code: string; message: string };

function apiKey(): string {
  const key = process.env.SLIP2GO_API_KEY;
  if (!key) throw new Error("SLIP2GO_API_KEY is not configured.");
  return key;
}

function baseUrl(): string {
  const url = process.env.SLIP2GO_API_BASE_URL;
  if (!url) throw new Error("SLIP2GO_API_BASE_URL is not configured.");
  return url.replace(/\/$/, "");
}

async function parseResult(res: Response): Promise<Slip2GoResult> {
  let body: { code?: string; message?: string; data?: Slip2GoSlipData };
  try {
    body = await res.json();
  } catch {
    return { ok: false, code: String(res.status), message: "Slip2Go returned an unreadable response." };
  }
  if (body.code === "200000" && body.data) {
    return { ok: true, data: body.data };
  }
  return {
    ok: false,
    code: body.code ?? String(res.status),
    message: body.message ?? "Slip verification failed.",
  };
}

/** Verify a slip from the QR payload string printed on the transfer receipt. */
export async function verifySlipByQrPayload(qrCode: string): Promise<Slip2GoResult> {
  const res = await fetch(`${baseUrl()}/api/verify-slip/qr-code/info`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload: { qrCode } }),
  });
  return parseResult(res);
}

/** Verify a slip from an uploaded image (JPEG/PNG/WebP). */
export async function verifySlipByImage(file: Blob, filename: string): Promise<Slip2GoResult> {
  const form = new FormData();
  form.append("file", file, filename);
  const res = await fetch(`${baseUrl()}/api/verify-slip/qr-image/info`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  return parseResult(res);
}
