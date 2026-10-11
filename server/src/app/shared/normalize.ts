/**
 * Canonical form for customer `area` values.
 * Rural area names are free-text and unpredictable, so matching must be
 * case/whitespace-insensitive. Only `area` is normalized — names and
 * addresses stay as typed for display (invoices, receipts).
 *
 * "  Char   Bhadrason " -> "char bhadrason"
 */
export const normalizeArea = (value: string): string => value.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Maps an optional incoming `area` to its storable form.
 * `undefined` stays `undefined` (field omitted); blank strings collapse
 * to `undefined` so we never persist '' alongside NULL.
 */
export const toStoredArea = (area: string | undefined): string | undefined => {
  if (area === undefined) return undefined;
  const normalized = normalizeArea(area);
  return normalized ? normalized : undefined;
};
