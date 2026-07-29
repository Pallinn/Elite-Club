/**
 * Adds a small deterministic per-booking offset (0-99 satang) to the base
 * price, so each booking's expected PromptPay amount is unique and an
 * incoming slip can be matched to exactly one booking by amount alone.
 */
export function computeExpectedAmountSatang(bookingId: string, baseSatang: number): number {
  const hex = bookingId.replace(/-/g, "").slice(-8);
  const offset = parseInt(hex, 16) % 100;
  return baseSatang + offset;
}
