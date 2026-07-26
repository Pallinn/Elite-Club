import { Resend } from "resend";

let client: Resend | null = null;

// Lazily constructed: Resend's constructor throws immediately on a missing/empty
// API key, which would otherwise crash module evaluation (and the production
// build's page-data collection) before any env vars are actually needed.
export function getResendClient(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
