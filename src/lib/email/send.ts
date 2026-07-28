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
 * Both templates reference the logo image via `src="cid:logo"`. Resend
 * converts the `attachments[]` entry with a `contentId` into an inline MIME
 * part, so Gmail/Outlook/Apple Mail all render it (unlike data URIs, which
 * Gmail blocks for security).
 */
export async function sendPurchaseEmail(params: {
  to: string;
  logoPng: Buffer;
  tables: Array<{
    tableCode: string;
    ticketNumber: string;
  }>;
}) {
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "Thank you for your purchase — NO SIGNAL",
    react: PurchaseEmail({
      logoCid: "cid:logo",
      tables: params.tables,
    }),
    attachments: [{ filename: "logo.png", content: params.logoPng, contentId: "logo" }],
  });
}

export async function sendJoinEmail(params: {
  to: string;
  logoPng: Buffer;
  ticketNumber: string;
}) {
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: "You're in — NO SIGNAL",
    react: JoinEmail({
      logoCid: "cid:logo",
      ticketNumber: params.ticketNumber,
    }),
    attachments: [{ filename: "logo.png", content: params.logoPng, contentId: "logo" }],
  });
}
