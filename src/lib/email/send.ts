import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import { ResetPasswordEmail } from "@/lib/email/templates/ResetPassword";
import { PurchaseEmail } from "@/lib/email/templates/PurchaseEmail";
import { JoinEmail } from "@/lib/email/templates/JoinEmail";

export async function sendResetPasswordEmail(params: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Reset your No Signal password",
    react: ResetPasswordEmail({ resetUrl: params.resetUrl, name: params.name }),
  });
}

/**
 * Both templates reference images via `src="cid:logo"` / `src="cid:qr-N"`.
 * Resend converts each `attachments[]` entry with a `contentId` into an inline
 * MIME part, so Gmail/Outlook/Apple Mail all render them (unlike data URIs,
 * which Gmail blocks for security).
 */
export async function sendPurchaseEmail(params: {
  to: string;
  logoPng: Buffer;
  tables: Array<{
    tableCode: string;
    qrPng: Buffer;
    ticketNumber: string;
  }>;
}) {
  const cids = params.tables.map((_, i) => `qr-${i}`);
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Thank you for your purchase — NO SIGNAL",
    react: PurchaseEmail({
      logoCid: "cid:logo",
      tables: params.tables.map((t, i) => ({
        tableCode: t.tableCode,
        qrCid: `cid:${cids[i]}`,
        ticketNumber: t.ticketNumber,
      })),
    }),
    attachments: [
      { filename: "logo.png", content: params.logoPng, contentId: "logo" },
      ...params.tables.map((t, i) => ({
        filename: `qr-${t.ticketNumber}.png`,
        content: t.qrPng,
        contentId: cids[i],
      })),
    ],
  });
}

export async function sendJoinEmail(params: {
  to: string;
  logoPng: Buffer;
  qrPng: Buffer;
  ticketNumber: string;
}) {
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "You're in — NO SIGNAL",
    react: JoinEmail({
      logoCid: "cid:logo",
      qrCid: "cid:qr",
      ticketNumber: params.ticketNumber,
    }),
    attachments: [
      { filename: "logo.png", content: params.logoPng, contentId: "logo" },
      { filename: `qr-${params.ticketNumber}.png`, content: params.qrPng, contentId: "qr" },
    ],
  });
}
