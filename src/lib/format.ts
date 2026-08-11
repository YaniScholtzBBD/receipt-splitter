export function formatRand(amount: number) {
  return `R${amount.toFixed(2)}`;
}

export function formatSplitDate(iso: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}
