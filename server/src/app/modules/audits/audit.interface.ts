import type { AUDIT_ACTIONS, AUDIT_MODULES } from './audit.constant.js';

export type TAuditModule = (typeof AUDIT_MODULES)[number];

export type TAuditAction = (typeof AUDIT_ACTIONS)[number];

export type TAuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface IAuditActor {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * One observed system activity. Every field is copied or arithmetically
 * derived (stockBefore = stockAfter - qtyDelta) from an existing stored
 * row — nothing is invented. `actor` is null when the source table stores
 * no actor (masters keep no createdBy), and `status` echoes an existing
 * status column (paymentStatus / isDeleted / isActive / ledger type).
 */
export interface IAuditEvent {
  id: string;
  module: TAuditModule;
  action: TAuditAction;
  /** Human reference: invoice no, email, product/party name. */
  refNo: string;
  recordId: string;
  title: string;
  summary: string;
  actor: IAuditActor | null;
  /** When the action was recorded (createdAt / updatedAt / paidAt). */
  eventAt: Date;
  severity: TAuditSeverity;
  status: string | null;
  details: Record<string, unknown>;
}

export interface IAuditEventFilters {
  searchTerm?: string;
  module?: TAuditModule;
  action?: TAuditAction;
  /** Actor user id (soldBy / receivedBy / collectedBy / ledger createdBy). */
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  limit?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IAuditOverview {
  range: { from: string | null; to: string | null };
  sales: { total: number; voided: number; grandTotal: number; dueTotal: number };
  purchases: { total: number; voided: number; grandTotal: number; dueTotal: number };
  payments: {
    total: number;
    amountTotal: number;
    customer: { count: number; amount: number };
    supplier: { count: number; amount: number };
  };
  stock: { total: number; byType: Record<string, number> };
  users: { total: number; admins: number; staff: number; deactivated: number };
  masters: { customers: number; suppliers: number; products: number };
  topActors: {
    id: string;
    name: string | null;
    email: string | null;
    sales: number;
    purchases: number;
    payments: number;
  }[];
}
