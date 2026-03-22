const ghsFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatGhanaCedis(value: number) {
  return ghsFormatter.format(value || 0);
}
