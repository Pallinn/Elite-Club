import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import { ResetPasswordEmail } from "@/lib/email/templates/ResetPassword";
import { TicketsEmail, type TicketEmailItem } from "@/lib/email/templates/TicketsEmail";

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

export async function sendTicketsEmail(params: {
  to: string;
  contactName?: string | null;
  eventName: string;
  venueName: string;
  startAt: string;
  tickets: TicketEmailItem[];
  isResend?: boolean;
}) {
  await getResendClient().emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: params.isResend
      ? `Your ${params.eventName} tickets`
      : `Payment received — your ${params.eventName} tickets`,
    react: TicketsEmail(params),
  });
}
