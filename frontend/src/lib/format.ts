export function formatMoneyMinor(amountMinor: number, currency: string = "INR"): string {
  if (currency === "INR") {
    const val = (amountMinor / 100).toFixed(2);
    return `₹${val}`;
  }
  if (currency === "USD") {
    const val = (amountMinor / 100).toFixed(2);
    return `$${val}`;
  }
  return `${amountMinor} ${currency}`;
}

export function buildRouteSummary(origin?: {name:string, country?:string} | null, stops?: Array<{city:{name:string}}>): string {
  const parts: string[] = [];
  if (origin?.name) parts.push(origin.name);
  if (stops && stops.length) parts.push(...stops.map(s => s.city.name));
  return parts.length ? parts.join(" → ") : "No route";
}


