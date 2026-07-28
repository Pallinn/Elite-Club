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

export function formatSatangRange(minSatang: number, maxSatang: number): string {
  return minSatang === maxSatang
    ? formatSatang(minSatang)
    : `${formatSatang(minSatang)}–${formatSatang(maxSatang)}`;
}
