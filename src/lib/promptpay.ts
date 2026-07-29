import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export type PromptPayQr = {
  payload: string;
  qrDataUrl: string;
};

/**
 * Generates a PromptPay EMV QR payload for the given amount and renders it as
 * a scannable PNG data URI, entirely server-side - no external QR/payment
 * provider involved.
 */
export async function generatePromptPayQr(amountSatang: number): Promise<PromptPayQr> {
  const promptPayId = process.env.PROMPTPAY_ID;
  if (!promptPayId) {
    throw new Error("PROMPTPAY_ID is not configured.");
  }

  const amountThb = amountSatang / 100;
  const payload = generatePayload(promptPayId, { amount: amountThb });
  const qrDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320 });

  return { payload, qrDataUrl };
}
