const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => faDigits[Number(d)]);
}

export function formatToman(amount: number): string {
  return toFaDigits(amount.toLocaleString("en-US"));
}
