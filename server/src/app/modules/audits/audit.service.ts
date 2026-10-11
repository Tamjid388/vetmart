import type { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { AUDIT_ACTIONS, AUDIT_MODULES, AuditSearchableFields, toAuditSeverity } from './audit.constant.js';
import type {
  IAuditActor,
  IAuditEvent,
  IAuditEventFilters,
  IAuditOverview,
  TAuditAction,
  TAuditModule,
} from './audit.interface.js';

const toNumber = (v: unknown): number => Number(v as number | string);

const MAX_LIMIT = 100;

/** Parse optional ISO date bounds; invalid values are ignored (no invented defaults). */
const parseRange = (filters: IAuditEventFilters): { from?: Date; to?: Date } => {
  const range: { from?: Date; to?: Date } = {};
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (!Number.isNaN(from.getTime())) range.from = from;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (!Number.isNaN(to.getTime())) range.to = to;
  }
  return range;
};

const dateFilter = (from?: Date, to?: Date): { gte?: Date; lte?: Date } => {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = from;
  if (to) filter.lte = to;
  return Object.keys(filter).length > 0 ? filter : {};
};

const hasDateFilter = (from?: Date, to?: Date): boolean => from !== undefined || to !== undefined;

const buildSearchOr = (term: string | undefined, fields: string[]): Record<string, unknown>[] | undefined => {
  if (!term || fields.length === 0) return undefined;
  return fields.map((field) => ({ [field]: { contains: term, mode: 'insensitive' as const } }));
};

/** Resolve stored user ids (e.g. StockLedger.createdBy) to display actors. */
const resolveActors = async (ids: string[]): Promise<Map<string, IAuditActor>> => {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, IAuditActor>();
  if (unique.length === 0) return map;
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  });
  for (const id of unique) {
    const found = users.find((u) => u.id === id);
    map.set(id, { id, name: found?.name ?? null, email: found?.email ?? null });
  }
  return map;
};

const actorOf = (
  user: { id: string; name: string | null; email: string | null } | null | undefined,
): IAuditActor | null => {
  if (!user) return null;
  return { id: user.id, name: user.name ?? null, email: user.email ?? null };
};

const eventId = (module: TAuditModule, action: TAuditAction, recordId: string): string =>
  `${module}:${action}:${recordId}`;

// ---------------------------------------------------------------------------
// Per-source collectors. Each reads one existing table with the shared
// filters and maps rows to audit events. No writes anywhere.
// ---------------------------------------------------------------------------

type CollectorCtx = {
  searchTerm?: string;
  userId?: string;
  from?: Date;
  to?: Date;
};

const collectSaleEvents = async (ctx: CollectorCtx, onlyAction?: TAuditAction): Promise<IAuditEvent[]> => {
  const events: IAuditEvent[] = [];
  const searchOr = buildSearchOr(ctx.searchTerm, AuditSearchableFields['sale'] ?? []);
  const baseWhere: Prisma.SaleWhereInput = {
    ...(ctx.userId ? { soldBy: ctx.userId } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  if (!onlyAction || onlyAction === 'created') {
    const rows = await prisma.sale.findMany({
      where: {
        ...baseWhere,
        isDeleted: false,
        ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        soldByUser: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    for (const row of rows) {
      const status = row.paymentStatus;
      events.push({
        id: eventId('sale', 'created', row.id),
        module: 'sale',
        action: 'created',
        refNo: row.invoiceNo,
        recordId: row.id,
        title: `Sale ${row.invoiceNo} recorded`,
        summary: `${row.customer?.name ?? 'Unknown customer'} • ${row.items.length} lines • ৳${toNumber(row.grandTotal)} • ${status}`,
        actor: actorOf(row.soldByUser),
        eventAt: row.createdAt,
        severity: toAuditSeverity({ action: 'created', status }),
        status,
        details: {
          invoiceNo: row.invoiceNo,
          customerId: row.customerId,
          customerName: row.customer?.name ?? null,
          saleDate: row.saleDate,
          subtotal: toNumber(row.subtotal),
          discount: toNumber(row.discount),
          vatTotal: toNumber(row.vatTotal),
          grandTotal: toNumber(row.grandTotal),
          paidAmount: toNumber(row.paidAmount),
          dueAmount: toNumber(row.dueAmount),
          paymentMethod: row.paymentMethod,
          paymentStatus: row.paymentStatus,
          itemCount: row.items.length,
          // Create-time counter note only; voids store no reason.
          notes: row.notes,
        },
      });
    }
  }

  if (!onlyAction || onlyAction === 'voided') {
    const rows = await prisma.sale.findMany({
      where: {
        ...baseWhere,
        isDeleted: true,
        ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        soldByUser: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      events.push({
        id: eventId('sale', 'voided', row.id),
        module: 'sale',
        action: 'voided',
        refNo: row.invoiceNo,
        recordId: row.id,
        title: `Sale ${row.invoiceNo} voided`,
        summary: `${row.customer?.name ?? 'Unknown customer'} • ৳${toNumber(row.grandTotal)} reversed with compensating stock return`,
        actor: actorOf(row.soldByUser),
        eventAt: row.updatedAt,
        severity: toAuditSeverity({ action: 'voided', status: 'VOIDED' }),
        status: 'VOIDED',
        details: {
          invoiceNo: row.invoiceNo,
          customerId: row.customerId,
          customerName: row.customer?.name ?? null,
          saleDate: row.saleDate,
          grandTotal: toNumber(row.grandTotal),
          dueAmount: toNumber(row.dueAmount),
          paymentStatus: row.paymentStatus,
          itemCount: row.items.length,
        },
      });
    }
  }

  return events;
};

const collectPurchaseEvents = async (ctx: CollectorCtx, onlyAction?: TAuditAction): Promise<IAuditEvent[]> => {
  const events: IAuditEvent[] = [];
  const searchOr = buildSearchOr(ctx.searchTerm, AuditSearchableFields['purchase'] ?? []);
  const baseWhere: Prisma.PurchaseWhereInput = {
    ...(ctx.userId ? { receivedBy: ctx.userId } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  if (!onlyAction || onlyAction === 'created') {
    const rows = await prisma.purchase.findMany({
      where: {
        ...baseWhere,
        isDeleted: false,
        ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      include: {
        supplier: { select: { id: true, companyName: true, phone: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    for (const row of rows) {
      const status = row.paymentStatus;
      events.push({
        id: eventId('purchase', 'created', row.id),
        module: 'purchase',
        action: 'created',
        refNo: row.invoiceNo,
        recordId: row.id,
        title: `Purchase ${row.invoiceNo} recorded`,
        summary: `${row.supplier?.companyName ?? 'Unknown supplier'} • ${row.items.length} lines • ৳${toNumber(row.grandTotal)} • ${status}`,
        actor: actorOf(row.receivedByUser),
        eventAt: row.createdAt,
        severity: toAuditSeverity({ action: 'created', status }),
        status,
        details: {
          invoiceNo: row.invoiceNo,
          supplierId: row.supplierId,
          supplierName: row.supplier?.companyName ?? null,
          purchaseDate: row.purchaseDate,
          subtotal: toNumber(row.subtotal),
          discount: toNumber(row.discount),
          vatTotal: toNumber(row.vatTotal),
          grandTotal: toNumber(row.grandTotal),
          paidAmount: toNumber(row.paidAmount),
          dueAmount: toNumber(row.dueAmount),
          paymentMethod: row.paymentMethod,
          paymentStatus: row.paymentStatus,
          itemCount: row.items.length,
          // Create-time challan/invoice reference only; voids store no reason.
          notes: row.notes,
        },
      });
    }
  }

  if (!onlyAction || onlyAction === 'voided') {
    const rows = await prisma.purchase.findMany({
      where: {
        ...baseWhere,
        isDeleted: true,
        ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      include: {
        supplier: { select: { id: true, companyName: true, phone: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      events.push({
        id: eventId('purchase', 'voided', row.id),
        module: 'purchase',
        action: 'voided',
        refNo: row.invoiceNo,
        recordId: row.id,
        title: `Purchase ${row.invoiceNo} voided`,
        summary: `${row.supplier?.companyName ?? 'Unknown supplier'} • ৳${toNumber(row.grandTotal)} un-received with compensating stock return`,
        actor: actorOf(row.receivedByUser),
        eventAt: row.updatedAt,
        severity: toAuditSeverity({ action: 'voided', status: 'VOIDED' }),
        status: 'VOIDED',
        details: {
          invoiceNo: row.invoiceNo,
          supplierId: row.supplierId,
          supplierName: row.supplier?.companyName ?? null,
          purchaseDate: row.purchaseDate,
          grandTotal: toNumber(row.grandTotal),
          dueAmount: toNumber(row.dueAmount),
          paymentStatus: row.paymentStatus,
          itemCount: row.items.length,
        },
      });
    }
  }

  return events;
};

const collectPaymentEvents = async (ctx: CollectorCtx): Promise<IAuditEvent[]> => {
  const searchOr: Prisma.PaymentWhereInput[] | undefined = ctx.searchTerm
    ? [
        { sale: { invoiceNo: { contains: ctx.searchTerm, mode: 'insensitive' } } },
        { purchase: { invoiceNo: { contains: ctx.searchTerm, mode: 'insensitive' } } },
      ]
    : undefined;
  const rows = await prisma.payment.findMany({
    where: {
      isDeleted: false,
      ...(ctx.userId ? { collectedBy: ctx.userId } : {}),
      ...(searchOr ? { OR: searchOr } : {}),
      ...(hasDateFilter(ctx.from, ctx.to) ? { paidAt: dateFilter(ctx.from, ctx.to) } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      supplier: { select: { id: true, companyName: true, phone: true } },
      sale: { select: { id: true, invoiceNo: true } },
      purchase: { select: { id: true, invoiceNo: true } },
      collectedByUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { paidAt: 'desc' },
  });
  return rows.map((row) => {
    const party = row.customer?.name ?? row.supplier?.companyName ?? 'Unknown party';
    const linked = row.sale?.invoiceNo ?? row.purchase?.invoiceNo ?? null;
    return {
      id: eventId('payment', 'collected', row.id),
      module: 'payment' as const,
      action: 'collected' as const,
      refNo: linked ?? `PAY-${row.id.slice(-6).toUpperCase()}`,
      recordId: row.id,
      title: `Payment of ৳${toNumber(row.amount)} collected`,
      summary: `${party}${linked ? ` • against ${linked}` : ' • against running due'} • ${row.method}`,
      actor: actorOf(row.collectedByUser),
      eventAt: row.paidAt,
      severity: toAuditSeverity({ action: 'collected', status: null }),
      status: null,
      details: {
        amount: toNumber(row.amount),
        method: row.method,
        paidAt: row.paidAt,
        customerId: row.customerId,
        customerName: row.customer?.name ?? null,
        supplierId: row.supplierId,
        supplierName: row.supplier?.companyName ?? null,
        saleId: row.saleId,
        saleInvoiceNo: row.sale?.invoiceNo ?? null,
        purchaseId: row.purchaseId,
        purchaseInvoiceNo: row.purchase?.invoiceNo ?? null,
      },
    };
  });
};

const collectStockEvents = async (ctx: CollectorCtx): Promise<IAuditEvent[]> => {
  const searchOr: Prisma.StockLedgerWhereInput[] | undefined = ctx.searchTerm
    ? [
        { refId: { contains: ctx.searchTerm, mode: 'insensitive' } },
        { product: { name: { contains: ctx.searchTerm, mode: 'insensitive' } } },
        { product: { sku: { contains: ctx.searchTerm, mode: 'insensitive' } } },
        { batch: { batchNumber: { contains: ctx.searchTerm, mode: 'insensitive' } } },
      ]
    : undefined;
  const rows = await prisma.stockLedger.findMany({
    where: {
      ...(ctx.userId ? { createdBy: ctx.userId } : {}),
      ...(searchOr ? { OR: searchOr } : {}),
      ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
    },
    include: {
      product: { select: { id: true, name: true, sku: true, unit: true } },
      batch: { select: { id: true, batchNumber: true, expiryDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const actors = await resolveActors(rows.map((row) => row.createdBy ?? ''));
  return rows.map((row) => {
    // before/after come straight from stored columns: stockAfter is
    // persisted, stockBefore is stockAfter - qtyDelta (same transaction).
    const stockAfter = row.stockAfter;
    const stockBefore = stockAfter - row.qtyDelta;
    const sign = row.qtyDelta > 0 ? `+${row.qtyDelta}` : `${row.qtyDelta}`;
    return {
      id: eventId('stock', 'movement', row.id),
      module: 'stock' as const,
      action: 'movement' as const,
      refNo: row.batch?.batchNumber ?? row.product?.name ?? row.id.slice(-6).toUpperCase(),
      recordId: row.id,
      title: `Stock ${row.type}: ${row.product?.name ?? 'Unknown product'} (${sign})`,
      summary: `${stockBefore} → ${stockAfter} ${row.product?.unit ?? ''} • batch ${row.batch?.batchNumber ?? '—'}${row.refId ? ` • ref ${row.refId.slice(-6).toUpperCase()}` : ''}`,
      actor: row.createdBy ? (actors.get(row.createdBy) ?? { id: row.createdBy, name: null, email: null }) : null,
      eventAt: row.createdAt,
      severity: toAuditSeverity({ action: 'movement', status: row.type }),
      status: row.type,
      details: {
        productId: row.productId,
        productName: row.product?.name ?? null,
        sku: row.product?.sku ?? null,
        unit: row.product?.unit ?? null,
        batchId: row.batchId,
        batchNumber: row.batch?.batchNumber ?? null,
        type: row.type,
        qtyDelta: row.qtyDelta,
        stockBefore,
        stockAfter,
        refId: row.refId,
      },
    };
  });
};

const collectUserEvents = async (ctx: CollectorCtx, onlyAction?: TAuditAction): Promise<IAuditEvent[]> => {
  // Masters store no actor, so user-activity scoping skips this source.
  if (ctx.userId) return [];
  const events: IAuditEvent[] = [];
  const searchOr = buildSearchOr(ctx.searchTerm, AuditSearchableFields['user'] ?? []);

  if (!onlyAction || onlyAction === 'created') {
    const rows = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(searchOr ? { OR: searchOr } : {}),
        ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    for (const row of rows) {
      events.push({
        id: eventId('user', 'created', row.id),
        module: 'user',
        action: 'created',
        refNo: row.email,
        recordId: row.id,
        title: `User ${row.email} created`,
        summary: `${row.name ?? row.email} • role ${row.role}`,
        actor: null,
        eventAt: row.createdAt,
        severity: toAuditSeverity({ action: 'created', status: null }),
        status: row.role === 'admin' ? 'ADMIN' : 'STAFF',
        details: { email: row.email, name: row.name, role: row.role },
      });
    }
  }

  if (!onlyAction || onlyAction === 'deactivated') {
    const rows = await prisma.user.findMany({
      where: {
        isDeleted: true,
        ...(searchOr ? { OR: searchOr } : {}),
        ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      events.push({
        id: eventId('user', 'deactivated', row.id),
        module: 'user',
        action: 'deactivated',
        refNo: row.email,
        recordId: row.id,
        title: `User ${row.email} deactivated`,
        summary: `${row.name ?? row.email} • role ${row.role} • soft-deleted`,
        actor: null,
        eventAt: row.updatedAt,
        severity: toAuditSeverity({ action: 'deactivated', status: 'DEACTIVATED' }),
        status: 'DEACTIVATED',
        details: { email: row.email, name: row.name, role: row.role },
      });
    }
  }

  return events;
};

type MasterKind = 'customer' | 'supplier' | 'product';

const collectMasterEvents = async (
  kind: MasterKind,
  ctx: CollectorCtx,
  onlyAction?: TAuditAction,
): Promise<IAuditEvent[]> => {
  // Masters store no actor, so user-activity scoping skips these sources.
  if (ctx.userId) return [];
  const events: IAuditEvent[] = [];
  const searchOr = buildSearchOr(ctx.searchTerm, AuditSearchableFields[kind] ?? []);

  if (kind === 'customer') {
    if (!onlyAction || onlyAction === 'created') {
      const rows = await prisma.customer.findMany({
        where: {
          isDeleted: false,
          ...(searchOr ? { OR: searchOr } : {}),
          ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const row of rows) {
        const status = row.isActive ? null : 'INACTIVE';
        events.push({
          id: eventId('customer', 'created', row.id),
          module: 'customer',
          action: 'created',
          refNo: row.name,
          recordId: row.id,
          title: `Customer ${row.name} added`,
          summary: `${row.phone} • due ৳${toNumber(row.dueBalance)}`,
          actor: null,
          eventAt: row.createdAt,
          severity: toAuditSeverity({ action: 'created', status }),
          status,
          details: {
            name: row.name,
            phone: row.phone,
            area: row.area,
            category: row.category,
            dueBalance: toNumber(row.dueBalance),
            isActive: row.isActive,
          },
        });
      }
    }
    if (!onlyAction || onlyAction === 'deactivated') {
      const rows = await prisma.customer.findMany({
        where: {
          isDeleted: true,
          ...(searchOr ? { OR: searchOr } : {}),
          ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });
      for (const row of rows) {
        events.push({
          id: eventId('customer', 'deactivated', row.id),
          module: 'customer',
          action: 'deactivated',
          refNo: row.name,
          recordId: row.id,
          title: `Customer ${row.name} removed`,
          summary: `${row.phone} • soft-deleted`,
          actor: null,
          eventAt: row.updatedAt,
          severity: toAuditSeverity({ action: 'deactivated', status: 'DEACTIVATED' }),
          status: 'DEACTIVATED',
          details: { name: row.name, phone: row.phone, dueBalance: toNumber(row.dueBalance) },
        });
      }
    }
    return events;
  }

  if (kind === 'supplier') {
    if (!onlyAction || onlyAction === 'created') {
      const rows = await prisma.supplier.findMany({
        where: {
          isDeleted: false,
          ...(searchOr ? { OR: searchOr } : {}),
          ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const row of rows) {
        const status = row.isActive ? null : 'INACTIVE';
        events.push({
          id: eventId('supplier', 'created', row.id),
          module: 'supplier',
          action: 'created',
          refNo: row.companyName,
          recordId: row.id,
          title: `Supplier ${row.companyName} added`,
          summary: `${row.phone} • payable ৳${toNumber(row.payableBalance)}`,
          actor: null,
          eventAt: row.createdAt,
          severity: toAuditSeverity({ action: 'created', status }),
          status,
          details: {
            companyName: row.companyName,
            contactPerson: row.contactPerson,
            phone: row.phone,
            payableBalance: toNumber(row.payableBalance),
            isActive: row.isActive,
          },
        });
      }
    }
    if (!onlyAction || onlyAction === 'deactivated') {
      const rows = await prisma.supplier.findMany({
        where: {
          isDeleted: true,
          ...(searchOr ? { OR: searchOr } : {}),
          ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });
      for (const row of rows) {
        events.push({
          id: eventId('supplier', 'deactivated', row.id),
          module: 'supplier',
          action: 'deactivated',
          refNo: row.companyName,
          recordId: row.id,
          title: `Supplier ${row.companyName} removed`,
          summary: `${row.phone} • soft-deleted`,
          actor: null,
          eventAt: row.updatedAt,
          severity: toAuditSeverity({ action: 'deactivated', status: 'DEACTIVATED' }),
          status: 'DEACTIVATED',
          details: {
            companyName: row.companyName,
            phone: row.phone,
            payableBalance: toNumber(row.payableBalance),
          },
        });
      }
    }
    return events;
  }

  if (!onlyAction || onlyAction === 'created') {
    const rows = await prisma.product.findMany({
      where: {
        isDeleted: false,
        ...(searchOr ? { OR: searchOr } : {}),
        ...(hasDateFilter(ctx.from, ctx.to) ? { createdAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    for (const row of rows) {
      const status = row.isActive ? null : 'INACTIVE';
      events.push({
        id: eventId('product', 'created', row.id),
        module: 'product',
        action: 'created',
        refNo: row.name,
        recordId: row.id,
        title: `Product ${row.name} added`,
        summary: `${row.productType} • ${row.category?.name ?? 'uncategorized'} • ৳${toNumber(row.sellingPrice)}/${row.unit}`,
        actor: null,
        eventAt: row.createdAt,
        severity: toAuditSeverity({ action: 'created', status }),
        status,
        details: {
          name: row.name,
          sku: row.sku,
          productType: row.productType,
          category: row.category?.name ?? null,
          unit: row.unit,
          purchasePrice: toNumber(row.purchasePrice),
          sellingPrice: toNumber(row.sellingPrice),
          isActive: row.isActive,
        },
      });
    }
  }
  if (!onlyAction || onlyAction === 'deactivated') {
    const rows = await prisma.product.findMany({
      where: {
        isDeleted: true,
        ...(searchOr ? { OR: searchOr } : {}),
        ...(hasDateFilter(ctx.from, ctx.to) ? { updatedAt: dateFilter(ctx.from, ctx.to) } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    for (const row of rows) {
      events.push({
        id: eventId('product', 'deactivated', row.id),
        module: 'product',
        action: 'deactivated',
        refNo: row.name,
        recordId: row.id,
        title: `Product ${row.name} removed`,
        summary: `${row.productType} • soft-deleted`,
        actor: null,
        eventAt: row.updatedAt,
        severity: toAuditSeverity({ action: 'deactivated', status: 'DEACTIVATED' }),
        status: 'DEACTIVATED',
        details: { name: row.name, sku: row.sku, productType: row.productType },
      });
    }
  }
  return events;
};

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

const normalizeFilters = (query: IAuditEventFilters): IAuditEventFilters => {
  const normalized: IAuditEventFilters = { ...query };
  // Unknown module values are dropped so the timeline still returns data
  // instead of failing on a bad query param.
  if (normalized.module && !(AUDIT_MODULES as readonly string[]).includes(normalized.module)) {
    delete normalized.module;
  }
  if (normalized.action && !(AUDIT_ACTIONS as readonly string[]).includes(normalized.action)) {
    delete normalized.action;
  }
  return normalized;
};

const collectAll = async (filters: IAuditEventFilters): Promise<IAuditEvent[]> => {
  const { from, to } = parseRange(filters);
  const ctx: CollectorCtx = {
    ...(filters.searchTerm ? { searchTerm: filters.searchTerm } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const onlyModule = filters.module;
  const onlyAction = filters.action;
  const buckets: Promise<IAuditEvent[]>[] = [];

  // Action/module scoping: only query sources that can produce the
  // requested slice. Payment rows are immutable (no void route), masters
  // and users carry no actor.
  if ((!onlyModule || onlyModule === 'sale') && (!onlyAction || onlyAction === 'created' || onlyAction === 'voided')) {
    buckets.push(collectSaleEvents(ctx, onlyAction));
  }
  if (
    (!onlyModule || onlyModule === 'purchase') &&
    (!onlyAction || onlyAction === 'created' || onlyAction === 'voided')
  ) {
    buckets.push(collectPurchaseEvents(ctx, onlyAction));
  }
  if ((!onlyModule || onlyModule === 'payment') && (!onlyAction || onlyAction === 'collected')) {
    buckets.push(collectPaymentEvents(ctx));
  }
  if ((!onlyModule || onlyModule === 'stock') && (!onlyAction || onlyAction === 'movement')) {
    buckets.push(collectStockEvents(ctx));
  }
  if (
    (!onlyModule || onlyModule === 'user') &&
    (!onlyAction || onlyAction === 'created' || onlyAction === 'deactivated')
  ) {
    buckets.push(collectUserEvents(ctx, onlyAction));
  }
  for (const kind of ['customer', 'supplier', 'product'] as const) {
    if (
      (!onlyModule || onlyModule === kind) &&
      (!onlyAction || onlyAction === 'created' || onlyAction === 'deactivated')
    ) {
      buckets.push(collectMasterEvents(kind, ctx, onlyAction));
    }
  }

  const results = await Promise.all(buckets);
  const merged = results.flat();
  const direction = filters.sortOrder === 'asc' ? 1 : -1;
  merged.sort((a, b) => direction * (a.eventAt.getTime() - b.eventAt.getTime()));
  return merged;
};

const getEvents = async (
  query: IAuditEventFilters,
): Promise<{ meta: { page: number; limit: number; total: number; totalPage: number }; data: IAuditEvent[] }> => {
  const filters = normalizeFilters(query);
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(filters.limit) || 10));
  const merged = await collectAll(filters);
  const total = merged.length;
  const data = merged.slice((page - 1) * limit, page * limit);
  return { meta: { page, limit, total, totalPage: Math.ceil(total / limit) }, data };
};

const getOverview = async (query: IAuditEventFilters): Promise<IAuditOverview> => {
  const { from, to } = parseRange(query);
  const createdInRange = hasDateFilter(from, to) ? { createdAt: dateFilter(from, to) } : {};
  const paidInRange = hasDateFilter(from, to) ? { paidAt: dateFilter(from, to) } : {};
  const movedInRange = hasDateFilter(from, to) ? { createdAt: dateFilter(from, to) } : {};

  const [
    saleCount,
    saleVoided,
    saleSums,
    saleDueSums,
    purchaseCount,
    purchaseVoided,
    purchaseSums,
    purchaseDueSums,
    paymentCount,
    paymentSums,
    customerPayments,
    supplierPayments,
    stockCount,
    stockByType,
    userCount,
    adminCount,
    userDeactivated,
    customerCount,
    supplierCount,
    productCount,
    salesByUser,
    purchasesByUser,
    paymentsByUser,
  ] = await Promise.all([
    prisma.sale.count({ where: { isDeleted: false, ...createdInRange } }),
    prisma.sale.count({
      where: { isDeleted: true, ...(hasDateFilter(from, to) ? { updatedAt: dateFilter(from, to) } : {}) },
    }),
    prisma.sale.aggregate({ where: { isDeleted: false, ...createdInRange }, _sum: { grandTotal: true } }),
    prisma.sale.aggregate({ where: { isDeleted: false, ...createdInRange }, _sum: { dueAmount: true } }),
    prisma.purchase.count({ where: { isDeleted: false, ...createdInRange } }),
    prisma.purchase.count({
      where: { isDeleted: true, ...(hasDateFilter(from, to) ? { updatedAt: dateFilter(from, to) } : {}) },
    }),
    prisma.purchase.aggregate({ where: { isDeleted: false, ...createdInRange }, _sum: { grandTotal: true } }),
    prisma.purchase.aggregate({ where: { isDeleted: false, ...createdInRange }, _sum: { dueAmount: true } }),
    prisma.payment.count({ where: { isDeleted: false, ...paidInRange } }),
    prisma.payment.aggregate({ where: { isDeleted: false, ...paidInRange }, _sum: { amount: true } }),
    prisma.payment.aggregate({
      where: { isDeleted: false, customerId: { not: null }, ...paidInRange },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { isDeleted: false, supplierId: { not: null }, ...paidInRange },
      _sum: { amount: true },
    }),
    prisma.stockLedger.count({ where: { ...movedInRange } }),
    prisma.stockLedger.groupBy({ by: ['type'], where: { ...movedInRange }, _count: { type: true } }),
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { isDeleted: false, role: 'admin' } }),
    prisma.user.count({ where: { isDeleted: true } }),
    prisma.customer.count({ where: { isDeleted: false } }),
    prisma.supplier.count({ where: { isDeleted: false } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.sale.groupBy({ by: ['soldBy'], where: { ...createdInRange }, _count: { soldBy: true } }),
    prisma.purchase.groupBy({ by: ['receivedBy'], where: { ...createdInRange }, _count: { receivedBy: true } }),
    prisma.payment.groupBy({
      by: ['collectedBy'],
      where: { isDeleted: false, ...paidInRange },
      _count: { collectedBy: true },
    }),
  ]);

  const customerPaymentCount = await prisma.payment.count({
    where: { isDeleted: false, customerId: { not: null }, ...paidInRange },
  });
  const supplierPaymentCount = await prisma.payment.count({
    where: { isDeleted: false, supplierId: { not: null }, ...paidInRange },
  });

  const byType: Record<string, number> = {};
  for (const row of stockByType) {
    byType[row.type] = row._count.type;
  }

  // Top actors merge the three existing actor FKs (soldBy / receivedBy /
  // collectedBy) — activity already stored on each transaction row.
  const activity = new Map<string, { sales: number; purchases: number; payments: number }>();
  for (const row of salesByUser) {
    const entry = activity.get(row.soldBy) ?? { sales: 0, purchases: 0, payments: 0 };
    entry.sales = row._count.soldBy;
    activity.set(row.soldBy, entry);
  }
  for (const row of purchasesByUser) {
    const entry = activity.get(row.receivedBy) ?? { sales: 0, purchases: 0, payments: 0 };
    entry.purchases = row._count.receivedBy;
    activity.set(row.receivedBy, entry);
  }
  for (const row of paymentsByUser) {
    const entry = activity.get(row.collectedBy) ?? { sales: 0, purchases: 0, payments: 0 };
    entry.payments = row._count.collectedBy;
    activity.set(row.collectedBy, entry);
  }
  const topIds = [...activity.entries()]
    .sort((a, b) => b[1].sales + b[1].purchases + b[1].payments - (a[1].sales + a[1].purchases + a[1].payments))
    .slice(0, 5);
  const topUsers =
    topIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topIds.map(([id]) => id) } },
          select: { id: true, name: true, email: true },
        })
      : [];

  return {
    range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    sales: {
      total: saleCount,
      voided: saleVoided,
      grandTotal: toNumber(saleSums._sum.grandTotal ?? 0),
      dueTotal: toNumber(saleDueSums._sum.dueAmount ?? 0),
    },
    purchases: {
      total: purchaseCount,
      voided: purchaseVoided,
      grandTotal: toNumber(purchaseSums._sum.grandTotal ?? 0),
      dueTotal: toNumber(purchaseDueSums._sum.dueAmount ?? 0),
    },
    payments: {
      total: paymentCount,
      amountTotal: toNumber(paymentSums._sum.amount ?? 0),
      customer: { count: customerPaymentCount, amount: toNumber(customerPayments._sum.amount ?? 0) },
      supplier: { count: supplierPaymentCount, amount: toNumber(supplierPayments._sum.amount ?? 0) },
    },
    stock: { total: stockCount, byType },
    users: { total: userCount, admins: adminCount, staff: userCount - adminCount, deactivated: userDeactivated },
    masters: { customers: customerCount, suppliers: supplierCount, products: productCount },
    topActors: topIds.map(([id, counts]) => {
      const user = topUsers.find((u) => u.id === id);
      return { id, name: user?.name ?? null, email: user?.email ?? null, ...counts };
    }),
  };
};

const getEventDetail = async (
  module: string,
  id: string,
): Promise<{ event: IAuditEvent; record: Record<string, unknown> }> => {
  if (!(AUDIT_MODULES as readonly string[]).includes(module)) {
    throw new AppError(StatusCodes.BAD_REQUEST, `Unknown audit module: ${module}`);
  }
  const auditModule = module as TAuditModule;

  if (auditModule === 'sale') {
    const row = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        soldByUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Sale not found');
    const action: TAuditAction = row.isDeleted ? 'voided' : 'created';
    const status = row.isDeleted ? 'VOIDED' : row.paymentStatus;
    const event: IAuditEvent = {
      id: eventId('sale', action, row.id),
      module: 'sale',
      action,
      refNo: row.invoiceNo,
      recordId: row.id,
      title: row.isDeleted ? `Sale ${row.invoiceNo} voided` : `Sale ${row.invoiceNo} recorded`,
      summary: `${row.customer?.name ?? 'Unknown customer'} • ৳${toNumber(row.grandTotal)}`,
      actor: actorOf(row.soldByUser),
      eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
      severity: toAuditSeverity({ action, status }),
      status,
      details: {
        invoiceNo: row.invoiceNo,
        saleDate: row.saleDate,
        subtotal: toNumber(row.subtotal),
        discount: toNumber(row.discount),
        vatTotal: toNumber(row.vatTotal),
        grandTotal: toNumber(row.grandTotal),
        paidAmount: toNumber(row.paidAmount),
        dueAmount: toNumber(row.dueAmount),
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        notes: row.notes,
      },
    };
    return {
      event,
      record: {
        ...row,
        subtotal: toNumber(row.subtotal),
        discount: toNumber(row.discount),
        vatTotal: toNumber(row.vatTotal),
        grandTotal: toNumber(row.grandTotal),
        paidAmount: toNumber(row.paidAmount),
        dueAmount: toNumber(row.dueAmount),
        items: row.items.map((item) => ({
          ...item,
          sellingPrice: toNumber(item.sellingPrice),
          purchasePrice: toNumber(item.purchasePrice),
          vatPercent: toNumber(item.vatPercent),
          lineTotal: toNumber(item.lineTotal),
        })),
      },
    };
  }

  if (auditModule === 'purchase') {
    const row = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, companyName: true, phone: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            batch: { select: { id: true, batchNumber: true, expiryDate: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Purchase not found');
    const action: TAuditAction = row.isDeleted ? 'voided' : 'created';
    const status = row.isDeleted ? 'VOIDED' : row.paymentStatus;
    const event: IAuditEvent = {
      id: eventId('purchase', action, row.id),
      module: 'purchase',
      action,
      refNo: row.invoiceNo,
      recordId: row.id,
      title: row.isDeleted ? `Purchase ${row.invoiceNo} voided` : `Purchase ${row.invoiceNo} recorded`,
      summary: `${row.supplier?.companyName ?? 'Unknown supplier'} • ৳${toNumber(row.grandTotal)}`,
      actor: actorOf(row.receivedByUser),
      eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
      severity: toAuditSeverity({ action, status }),
      status,
      details: {
        invoiceNo: row.invoiceNo,
        purchaseDate: row.purchaseDate,
        subtotal: toNumber(row.subtotal),
        discount: toNumber(row.discount),
        vatTotal: toNumber(row.vatTotal),
        grandTotal: toNumber(row.grandTotal),
        paidAmount: toNumber(row.paidAmount),
        dueAmount: toNumber(row.dueAmount),
        paymentMethod: row.paymentMethod,
        paymentStatus: row.paymentStatus,
        notes: row.notes,
      },
    };
    return {
      event,
      record: {
        ...row,
        subtotal: toNumber(row.subtotal),
        discount: toNumber(row.discount),
        vatTotal: toNumber(row.vatTotal),
        grandTotal: toNumber(row.grandTotal),
        paidAmount: toNumber(row.paidAmount),
        dueAmount: toNumber(row.dueAmount),
        items: row.items.map((item) => ({
          ...item,
          purchasePrice: toNumber(item.purchasePrice),
          sellingPrice: toNumber(item.sellingPrice),
          vatPercent: toNumber(item.vatPercent),
          lineTotal: toNumber(item.lineTotal),
          weightKg: item.weightKg === null ? null : toNumber(item.weightKg),
        })),
      },
    };
  }

  if (auditModule === 'payment') {
    const row = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        supplier: { select: { id: true, companyName: true, phone: true } },
        sale: { select: { id: true, invoiceNo: true } },
        purchase: { select: { id: true, invoiceNo: true } },
        collectedByUser: { select: { id: true, name: true, email: true } },
      },
    });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
    const event: IAuditEvent = {
      id: eventId('payment', 'collected', row.id),
      module: 'payment',
      action: 'collected',
      refNo: row.sale?.invoiceNo ?? row.purchase?.invoiceNo ?? `PAY-${row.id.slice(-6).toUpperCase()}`,
      recordId: row.id,
      title: `Payment of ৳${toNumber(row.amount)} collected`,
      summary: `${row.customer?.name ?? row.supplier?.companyName ?? 'Unknown party'} • ${row.method}`,
      actor: actorOf(row.collectedByUser),
      eventAt: row.paidAt,
      severity: toAuditSeverity({ action: 'collected', status: null }),
      status: null,
      details: { amount: toNumber(row.amount), method: row.method, paidAt: row.paidAt },
    };
    return { event, record: { ...row, amount: toNumber(row.amount) } };
  }

  if (auditModule === 'stock') {
    const row = await prisma.stockLedger.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        batch: { select: { id: true, batchNumber: true, expiryDate: true } },
      },
    });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Stock movement not found');
    const actors = await resolveActors(row.createdBy ? [row.createdBy] : []);
    const event: IAuditEvent = {
      id: eventId('stock', 'movement', row.id),
      module: 'stock',
      action: 'movement',
      refNo: row.batch?.batchNumber ?? row.product?.name ?? row.id,
      recordId: row.id,
      title: `Stock ${row.type}: ${row.product?.name ?? 'Unknown product'}`,
      summary: `${row.stockAfter - row.qtyDelta} → ${row.stockAfter}`,
      actor: row.createdBy ? (actors.get(row.createdBy) ?? { id: row.createdBy, name: null, email: null }) : null,
      eventAt: row.createdAt,
      severity: toAuditSeverity({ action: 'movement', status: row.type }),
      status: row.type,
      details: {
        type: row.type,
        qtyDelta: row.qtyDelta,
        stockBefore: row.stockAfter - row.qtyDelta,
        stockAfter: row.stockAfter,
        refId: row.refId,
      },
    };
    return { event, record: { ...row } };
  }

  if (auditModule === 'user') {
    const row = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, isDeleted: true, createdAt: true, updatedAt: true },
    });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    const action: TAuditAction = row.isDeleted ? 'deactivated' : 'created';
    const status = row.isDeleted ? 'DEACTIVATED' : row.role === 'admin' ? 'ADMIN' : 'STAFF';
    const event: IAuditEvent = {
      id: eventId('user', action, row.id),
      module: 'user',
      action,
      refNo: row.email,
      recordId: row.id,
      title: row.isDeleted ? `User ${row.email} deactivated` : `User ${row.email} created`,
      summary: `${row.name ?? row.email} • role ${row.role}`,
      actor: null,
      eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
      severity: toAuditSeverity({ action, status }),
      status,
      details: { email: row.email, name: row.name, role: row.role },
    };
    return { event, record: { ...row } };
  }

  if (auditModule === 'customer') {
    const row = await prisma.customer.findUnique({ where: { id } });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');
    const action: TAuditAction = row.isDeleted ? 'deactivated' : 'created';
    const status = row.isDeleted ? 'DEACTIVATED' : row.isActive ? null : 'INACTIVE';
    const event: IAuditEvent = {
      id: eventId('customer', action, row.id),
      module: 'customer',
      action,
      refNo: row.name,
      recordId: row.id,
      title: row.isDeleted ? `Customer ${row.name} removed` : `Customer ${row.name} added`,
      summary: `${row.phone} • due ৳${toNumber(row.dueBalance)}`,
      actor: null,
      eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
      severity: toAuditSeverity({ action, status }),
      status,
      details: { name: row.name, phone: row.phone, dueBalance: toNumber(row.dueBalance) },
    };
    return { event, record: { ...row, dueBalance: toNumber(row.dueBalance) } };
  }

  if (auditModule === 'supplier') {
    const row = await prisma.supplier.findUnique({ where: { id } });
    if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Supplier not found');
    const action: TAuditAction = row.isDeleted ? 'deactivated' : 'created';
    const status = row.isDeleted ? 'DEACTIVATED' : row.isActive ? null : 'INACTIVE';
    const event: IAuditEvent = {
      id: eventId('supplier', action, row.id),
      module: 'supplier',
      action,
      refNo: row.companyName,
      recordId: row.id,
      title: row.isDeleted ? `Supplier ${row.companyName} removed` : `Supplier ${row.companyName} added`,
      summary: `${row.phone} • payable ৳${toNumber(row.payableBalance)}`,
      actor: null,
      eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
      severity: toAuditSeverity({ action, status }),
      status,
      details: { companyName: row.companyName, phone: row.phone, payableBalance: toNumber(row.payableBalance) },
    };
    return { event, record: { ...row, payableBalance: toNumber(row.payableBalance) } };
  }

  const row = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });
  if (!row) throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  const action: TAuditAction = row.isDeleted ? 'deactivated' : 'created';
  const status = row.isDeleted ? 'DEACTIVATED' : row.isActive ? null : 'INACTIVE';
  const event: IAuditEvent = {
    id: eventId('product', action, row.id),
    module: 'product',
    action,
    refNo: row.name,
    recordId: row.id,
    title: row.isDeleted ? `Product ${row.name} removed` : `Product ${row.name} added`,
    summary: `${row.productType} • ৳${toNumber(row.sellingPrice)}/${row.unit}`,
    actor: null,
    eventAt: row.isDeleted ? row.updatedAt : row.createdAt,
    severity: toAuditSeverity({ action, status }),
    status,
    details: {
      name: row.name,
      sku: row.sku,
      purchasePrice: toNumber(row.purchasePrice),
      sellingPrice: toNumber(row.sellingPrice),
    },
  };
  return {
    event,
    record: {
      ...row,
      purchasePrice: toNumber(row.purchasePrice),
      sellingPrice: toNumber(row.sellingPrice),
      vatPercent: toNumber(row.vatPercent),
    },
  };
};

export const AuditService = {
  getEvents,
  getOverview,
  getEventDetail,
};
