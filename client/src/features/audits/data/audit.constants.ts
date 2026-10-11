import type { AuditAction, AuditListFilters, AuditModule } from '../types/index.ts';

export const PAGE_SIZE = 10;

export const DEFAULT_AUDIT_FILTERS: AuditListFilters = {
  search: '',
  module: 'all',
  action: 'all',
  dateFrom: '',
  dateTo: '',
};

export const AUDIT_MODULE_OPTIONS: { value: AuditModule; label: string }[] = [
  { value: 'sale', label: 'Sales' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'payment', label: 'Payments' },
  { value: 'stock', label: 'Stock' },
  { value: 'user', label: 'Users' },
  { value: 'customer', label: 'Customers' },
  { value: 'supplier', label: 'Suppliers' },
  { value: 'product', label: 'Products' },
];

export const AUDIT_ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: 'created', label: 'Created' },
  { value: 'voided', label: 'Voided' },
  { value: 'collected', label: 'Collected' },
  { value: 'movement', label: 'Stock movement' },
  { value: 'deactivated', label: 'Deactivated' },
];
