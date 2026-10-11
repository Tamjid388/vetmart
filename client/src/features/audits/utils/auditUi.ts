import type { AuditAction, AuditModule, AuditSeverity } from '../types/index.ts';

export const severityColor: Record<AuditSeverity, string> = {
  info: 'blue',
  success: 'green',
  warning: 'orange',
  critical: 'red',
};

export const moduleColor: Record<AuditModule, string> = {
  sale: 'blue',
  purchase: 'purple',
  payment: 'green',
  stock: 'cyan',
  user: 'gold',
  customer: 'orange',
  supplier: 'magenta',
  product: 'lime',
};

export const actionColor: Record<AuditAction, string> = {
  created: 'blue',
  voided: 'red',
  collected: 'green',
  movement: 'cyan',
  deactivated: 'red',
};

export function statusColor(status: string | null): string {
  switch (status) {
    case 'PAID':
      return 'green';
    case 'PARTIAL':
    case 'INACTIVE':
    case 'RETURN':
      return 'orange';
    case 'DUE':
    case 'VOIDED':
    case 'DEACTIVATED':
      return 'red';
    case 'ADMIN':
      return 'purple';
    case 'STAFF':
      return 'blue';
    case 'OPENING':
      return 'default';
    case 'PURCHASE':
      return 'purple';
    case 'SALE':
      return 'blue';
    default:
      return 'default';
  }
}
