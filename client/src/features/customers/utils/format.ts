export function formatTaka(value: number) {
  return `৳${value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function formatCustomerId(id: string) {
  return id.startsWith('#') ? id : `#${id}`;
}

/**
 * Display form of a stored (lowercase) area: "char bhadrason" -> "Char Bhadrason".
 * Storage stays lowercase for matching; only presentation is capitalized.
 */
export function formatArea(area: string | null | undefined) {
  if (!area) return '—';
  return area
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}
