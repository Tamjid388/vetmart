export type AuditModule =
  | 'sale'
  | 'purchase'
  | 'payment'
  | 'stock'
  | 'user'
  | 'customer'
  | 'supplier'
  | 'product';

export type AuditAction = 'created' | 'voided' | 'collected' | 'movement' | 'deactivated';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export type AuditActor = {
  id: string;
  name: string | null;
  email: string | null;
};

/**
 * One observed system activity. Read-only projection of an existing ERP
 * row — the audit module never creates or edits business data.
 * Fields that do not exist in the ERP (IP/device, login history, approval
 * workflow, export history, change reasons) are intentionally absent.
 */
export type AuditEvent = {
  id: string;
  module: AuditModule;
  action: AuditAction;
  refNo: string;
  recordId: string;
  title: string;
  summary: string;
  actor: AuditActor | null;
  eventAt: string;
  severity: AuditSeverity;
  status: string | null;
  details: Record<string, unknown>;
};

export type AuditEventDetail = {
  event: AuditEvent;
  record: Record<string, unknown>;
};

export type AuditOverview = {
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
};

export type AuditListFilters = {
  search: string;
  module: 'all' | AuditModule;
  action: 'all' | AuditAction;
  dateFrom: string;
  dateTo: string;
};

export type AuditListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
  module?: AuditModule;
  action?: AuditAction;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AuditListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
