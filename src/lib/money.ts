export function satangToBaht(satang: number): number {
  return satang / 100;
}

export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

export function formatSatang(satang: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(satangToBaht(satang));
}
