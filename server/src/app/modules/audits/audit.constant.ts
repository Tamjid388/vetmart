/**
 * Audit module constants.
 *
 * The audit module is strictly read-only: it observes rows that already
 * exist in the ERP (sales, purchases, payments, stock ledger, users,
 * masters) and never writes, edits, or invents business data.
 * Everything below mirrors fields/routes that already exist elsewhere.
 */

// Modules the audit timeline can report on. Each maps to an existing table.
export const AUDIT_MODULES = [
  'sale',
  'purchase',
  'payment',
  'stock',
  'user',
  'customer',
  'supplier',
  'product',
] as const;

// Actions derived only from existing columns (createdAt / updatedAt /
// paidAt / isDeleted / StockLedger.type). No workflow state is invented:
// e.g. "voided" means the row already has isDeleted = true (set by the
// existing admin-only void endpoints), "deactivated" means isDeleted = true
// (set by the existing softDelete endpoints).
export const AUDIT_ACTIONS = ['created', 'voided', 'collected', 'movement', 'deactivated'] as const;

// StockLedger.type values already stored in stock_ledger (see
// prisma/schema/inventory.prisma). ADJUSTMENT is listed because the enum
// exists even though no current service writes it yet.
export const AUDIT_STOCK_TYPES = ['OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'] as const;

// Searchable fields reuse each source module's own SearchableFields:
// Sale/Purchase -> invoiceNo; User -> email/name; Customer ->
// name/phone/area; Supplier -> companyName/phone/contactPerson; Product ->
// name/sku.
export const AuditSearchableFields: Record<string, string[]> = {
  sale: ['invoiceNo'],
  purchase: ['invoiceNo'],
  user: ['email', 'name'],
  customer: ['name', 'phone', 'area'],
  supplier: ['companyName', 'phone', 'contactPerson'],
  product: ['name', 'sku'],
};

/**
 * Display-only severity hint for the audit UI. This is NOT business logic:
 * it only maps already-stored state (void/deleted flags, DUE/PARTIAL
 * payment status, RETURN ledger rows) to a tag color so admins can scan
 * the timeline. Unknown/absent state falls back to 'info'.
 */
export const toAuditSeverity = (input: {
  action: string;
  status: string | null;
}): 'info' | 'success' | 'warning' | 'critical' => {
  if (input.action === 'voided' || input.action === 'deactivated') return 'critical';
  if (input.status === 'VOIDED' || input.status === 'DEACTIVATED') return 'critical';
  if (input.action === 'movement' && input.status === 'RETURN') return 'warning';
  if (input.status === 'DUE' || input.status === 'PARTIAL') return 'warning';
  if (input.action === 'collected' || input.status === 'PAID') return 'success';
  return 'info';
};
