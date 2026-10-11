export function formatTaka(value: number) {
  return `৳${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatChangePercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatAxisValue(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(value);
}
