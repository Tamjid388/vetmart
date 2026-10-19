import { prisma } from '../../shared/prisma.js';
import {
  REPORT_DEFAULT_EXPIRY_DAYS,
  REPORT_MAX_LIMIT,
} from './report.constant.js';
import type {
  ICustomerDueRow,
  IExpiryReportRow,
  IProfitByProductRow,
  IProfitSummary,
  IPurchaseReportRow,
  IReportFilters,
  IReportOverview,
  IReportRange,
  ISalesReportRow,
  IStockReportRow,
  IVendorDueRow,
} from './report.interface.js';

const toNumber = (v: unknown): number => Number((v as number | string) ?? 0);
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parseRange = (filters: IReportFilters): { from?: Date; to?: Date } => {
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
  return filter;
};

const hasDateFilter = (from?: Date, to?: Date): boolean => from !== undefined || to !== undefined;

const paginate = (query: IReportFilters): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(REPORT_MAX_LIMIT, Math.max(1, Number(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const metaOf = (page: number, limit: number, total: number): { page: number; limit: number; total: number; totalPage: number } => ({
  page,
  limit,
  total,
  totalPage: Math.ceil(total / limit),
});

const rangeOf = (from?: Date, to?: Date): IReportRange => ({
  from: from?.toISOString() ?? null,
  to: to?.toISOString() ?? null,
});

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

const getOverview = async (query: IReportFilters): Promise<IReportOverview> => {
  const { from, to } = parseRange(query);
  const saleInRange = hasDateFilter(from, to) ? { saleDate: dateFilter(from, to) } : {};
  const purchaseInRange = hasDateFilter(from, to) ? { purchaseDate: dateFilter(from, to) } : {};

  const [
    saleCount,
    saleSums,
    salePaid,
    saleDue,
    purchaseCount,
    purchaseSums,
    purchasePaid,
    purchaseDue,
    customerDueAgg,
    customerDueCount,
    vendorDueAgg,
    vendorDueCount,
    productCount,
    batches,
    saleItems,
  ] = await Promise.all([
    prisma.sale.count({ where: { isDeleted: false, ...saleInRange } }),
    prisma.sale.aggregate({ where: { isDeleted: false, ...saleInRange }, _sum: { grandTotal: true } }),
    prisma.sale.aggregate({ where: { isDeleted: false, ...saleInRange }, _sum: { paidAmount: true } }),
    prisma.sale.aggregate({ where: { isDeleted: false, ...saleInRange }, _sum: { dueAmount: true } }),
    prisma.purchase.count({ where: { isDeleted: false, ...purchaseInRange } }),
    prisma.purchase.aggregate({ where: { isDeleted: false, ...purchaseInRange }, _sum: { grandTotal: true } }),
    prisma.purchase.aggregate({
      where: { isDeleted: false, ...purchaseInRange },
      _sum: { paidAmount: true },
    }),
    prisma.purchase.aggregate({
      where: { isDeleted: false, ...purchaseInRange },
      _sum: { dueAmount: true },
    }),
    prisma.customer.aggregate({ where: { isDeleted: false }, _sum: { dueBalance: true } }),
    prisma.customer.count({ where: { isDeleted: false, dueBalance: { gt: 0 } } }),
    prisma.supplier.aggregate({ where: { isDeleted: false }, _sum: { payableBalance: true } }),
    prisma.supplier.count({ where: { isDeleted: false, payableBalance: { gt: 0 } } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.productBatch.findMany({
      where: { product: { isDeleted: false } },
      select: { stock: true, expiryDate: true, purchasePrice: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { isDeleted: false, ...saleInRange } },
      select: { qty: true, sellingPrice: true, purchasePrice: true },
    }),
  ]);

  let stockValue = 0;
  let lowCount = 0;
  let criticalCount = 0;
  // Stock-status counts need minStock per product — fetch separately (cheap, single shop).
  const productsForStatus = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { minStock: true, batches: { select: { stock: true } } },
  });
  for (const p of productsForStatus) {
    const stock = p.batches.reduce((sum, b) => sum + b.stock, 0);
    if (p.minStock > 0 && stock <= 0.4 * p.minStock) criticalCount += 1;
    else if (p.minStock > 0 && stock <= p.minStock) lowCount += 1;
  }
  for (const b of batches) {
    stockValue += b.stock * toNumber(b.purchasePrice);
  }

  // FIFO-actual COGS from per-lot snapshots (SRS GAP-1: snapshot basis).
  let revenue = 0;
  let cogs = 0;
  for (const item of saleItems) {
    revenue += toNumber(item.sellingPrice) * item.qty;
    cogs += toNumber(item.purchasePrice) * item.qty;
  }

  const todayStart = startOfDay(new Date());
  let expiredBatches = 0;
  let nearExpiryBatches = 0;
  const windowEnd = new Date(todayStart);
  windowEnd.setDate(windowEnd.getDate() + REPORT_DEFAULT_EXPIRY_DAYS + 1);
  for (const b of batches) {
    if (b.stock <= 0 || !b.expiryDate) continue;
    if (b.expiryDate < todayStart) expiredBatches += 1;
    else if (b.expiryDate < windowEnd) nearExpiryBatches += 1;
  }

  return {
    range: rangeOf(from, to),
    sales: {
      count: saleCount,
      grandTotal: round2(toNumber(saleSums._sum.grandTotal ?? 0)),
      paidTotal: round2(toNumber(salePaid._sum.paidAmount ?? 0)),
      dueTotal: round2(toNumber(saleDue._sum.dueAmount ?? 0)),
    },
    purchases: {
      count: purchaseCount,
      grandTotal: round2(toNumber(purchaseSums._sum.grandTotal ?? 0)),
      paidTotal: round2(toNumber(purchasePaid._sum.paidAmount ?? 0)),
      dueTotal: round2(toNumber(purchaseDue._sum.dueAmount ?? 0)),
    },
    profit: {
      revenue: round2(revenue),
      cogs: round2(cogs),
      grossProfit: round2(revenue - cogs),
    },
    dues: {
      customerDue: round2(toNumber(customerDueAgg._sum.dueBalance ?? 0)),
      customerCount: customerDueCount,
      vendorDue: round2(toNumber(vendorDueAgg._sum.payableBalance ?? 0)),
      vendorCount: vendorDueCount,
    },
    stock: { products: productCount, stockValue: round2(stockValue), lowCount, criticalCount },
    expiry: { expiredBatches, nearExpiryBatches },
  };
};

// ---------------------------------------------------------------------------
// Sales / purchases lists
// ---------------------------------------------------------------------------

const getSales = async (query: IReportFilters) => {
  const { from, to } = parseRange(query);
  const { page, limit, skip } = paginate(query);
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const search = query.searchTerm?.trim();
  const where = {
    isDeleted: false,
    ...(hasDateFilter(from, to) ? { saleDate: dateFilter(from, to) } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: 'insensitive' as const } },
            { customer: { name: { contains: search, mode: 'insensitive' as const } } },
            { customer: { phone: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        items: { select: { id: true } },
      },
      orderBy: { saleDate: sortOrder },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);
  const data: ISalesReportRow[] = rows.map((row) => ({
    id: row.id,
    invoiceNo: row.invoiceNo,
    saleDate: row.saleDate,
    customerId: row.customerId,
    customerName: row.customer?.name ?? null,
    grandTotal: toNumber(row.grandTotal),
    paidAmount: toNumber(row.paidAmount),
    dueAmount: toNumber(row.dueAmount),
    paymentStatus: row.paymentStatus,
    itemCount: row.items.length,
  }));
  return { meta: metaOf(page, limit, total), data };
};

const getPurchases = async (query: IReportFilters) => {
  const { from, to } = parseRange(query);
  const { page, limit, skip } = paginate(query);
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const search = query.searchTerm?.trim();
  const where = {
    isDeleted: false,
    ...(hasDateFilter(from, to) ? { purchaseDate: dateFilter(from, to) } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNo: { contains: search, mode: 'insensitive' as const } },
            { supplier: { companyName: { contains: search, mode: 'insensitive' as const } } },
            { supplier: { phone: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true } },
        items: { select: { id: true } },
      },
      orderBy: { purchaseDate: sortOrder },
      skip,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);
  const data: IPurchaseReportRow[] = rows.map((row) => ({
    id: row.id,
    invoiceNo: row.invoiceNo,
    purchaseDate: row.purchaseDate,
    supplierId: row.supplierId,
    supplierName: row.supplier?.companyName ?? null,
    grandTotal: toNumber(row.grandTotal),
    paidAmount: toNumber(row.paidAmount),
    dueAmount: toNumber(row.dueAmount),
    paymentStatus: row.paymentStatus,
    itemCount: row.items.length,
  }));
  return { meta: metaOf(page, limit, total), data };
};

// ---------------------------------------------------------------------------
// Profit (FIFO-actual from SaleItem snapshots)
// ---------------------------------------------------------------------------

const getProfitSummary = async (query: IReportFilters): Promise<IProfitSummary> => {
  const { from, to } = parseRange(query);
  const inRange = hasDateFilter(from, to) ? { saleDate: dateFilter(from, to) } : {};
  const [sums, count, items] = await Promise.all([
    prisma.sale.aggregate({
      where: { isDeleted: false, ...inRange },
      _sum: { grandTotal: true, discount: true, vatTotal: true },
    }),
    prisma.sale.count({ where: { isDeleted: false, ...inRange } }),
    prisma.saleItem.findMany({
      where: { sale: { isDeleted: false, ...inRange } },
      select: { qty: true, sellingPrice: true, purchasePrice: true },
    }),
  ]);
  let revenue = 0;
  let cogs = 0;
  for (const item of items) {
    revenue += toNumber(item.sellingPrice) * item.qty;
    cogs += toNumber(item.purchasePrice) * item.qty;
  }
  revenue = round2(revenue);
  cogs = round2(cogs);
  const grandTotal = round2(toNumber(sums._sum.grandTotal ?? 0));
  return {
    range: rangeOf(from, to),
    revenue,
    cogs,
    grossProfit: round2(revenue - cogs),
    discount: round2(toNumber(sums._sum.discount ?? 0)),
    vatTotal: round2(toNumber(sums._sum.vatTotal ?? 0)),
    transactionCount: count,
    avgOrderValue: count > 0 ? round2(grandTotal / count) : 0,
  };
};

const getProfitByProduct = async (query: IReportFilters) => {
  const { from, to } = parseRange(query);
  const { page, limit } = paginate(query);
  const search = query.searchTerm?.trim().toLowerCase();
  const items = await prisma.saleItem.findMany({
    where: { sale: { isDeleted: false, ...(hasDateFilter(from, to) ? { saleDate: dateFilter(from, to) } : {}) } },
    include: { product: { select: { id: true, name: true, unit: true } } },
  });
  const byProduct = new Map<string, IProfitByProductRow>();
  for (const item of items) {
    const name = item.product?.name ?? 'Unknown product';
    if (search && !name.toLowerCase().includes(search)) continue;
    const revenue = toNumber(item.sellingPrice) * item.qty;
    const cogs = toNumber(item.purchasePrice) * item.qty;
    const entry = byProduct.get(item.productId) ?? {
      productId: item.productId,
      productName: name,
      unit: item.product?.unit ?? '',
      qtySold: 0,
      revenue: 0,
      cogs: 0,
      profit: 0,
    };
    entry.qtySold += item.qty;
    entry.revenue = round2(entry.revenue + revenue);
    entry.cogs = round2(entry.cogs + cogs);
    entry.profit = round2(entry.revenue - entry.cogs);
    byProduct.set(item.productId, entry);
  }
  const all = [...byProduct.values()].sort((a, b) => b.profit - a.profit);
  const total = all.length;
  const data = all.slice((page - 1) * limit, page * limit);
  return { meta: metaOf(page, limit, total), data };
};

// ---------------------------------------------------------------------------
// Dues
// ---------------------------------------------------------------------------

const getCustomerDues = async (query: IReportFilters) => {
  const { page, limit, skip } = paginate(query);
  const search = query.searchTerm?.trim();
  const area = query.area?.trim();
  const where = {
    isDeleted: false,
    dueBalance: { gt: 0 },
    ...(area ? { area: { equals: area, mode: 'insensitive' as const } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { area: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const [rows, total, totalDue] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { dueBalance: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
    prisma.customer.aggregate({ where, _sum: { dueBalance: true } }),
  ]);
  const data: ICustomerDueRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    area: row.area,
    category: row.category,
    dueBalance: toNumber(row.dueBalance),
  }));
  return { meta: metaOf(page, limit, total), summary: { totalDue: round2(toNumber(totalDue._sum.dueBalance ?? 0)) }, data };
};

const getVendorDues = async (query: IReportFilters) => {
  const { page, limit, skip } = paginate(query);
  const search = query.searchTerm?.trim();
  const where = {
    isDeleted: false,
    payableBalance: { gt: 0 },
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { contactPerson: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const [rows, total, totalDue] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { payableBalance: 'desc' },
      skip,
      take: limit,
    }),
    prisma.supplier.count({ where }),
    prisma.supplier.aggregate({ where, _sum: { payableBalance: true } }),
  ]);
  const data: IVendorDueRow[] = rows.map((row) => ({
    id: row.id,
    companyName: row.companyName,
    phone: row.phone,
    payableBalance: toNumber(row.payableBalance),
  }));
  return { meta: metaOf(page, limit, total), summary: { totalDue: round2(toNumber(totalDue._sum.payableBalance ?? 0)) }, data };
};

// ---------------------------------------------------------------------------
// Stock + expiry
// ---------------------------------------------------------------------------

const stockStatusOf = (stock: number, minStock: number): 'In Stock' | 'Low Stock' | 'Critical' => {
  if (minStock <= 0) return 'In Stock';
  if (stock <= 0.4 * minStock) return 'Critical';
  if (stock <= minStock) return 'Low Stock';
  return 'In Stock';
};

const getStock = async (query: IReportFilters) => {
  const { page, limit } = paginate(query);
  const search = query.searchTerm?.trim().toLowerCase();
  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      ...(query.productType ? { productType: query.productType } : {}),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      productType: true,
      unit: true,
      minStock: true,
      batches: { select: { stock: true, expiryDate: true, purchasePrice: true } },
    },
    orderBy: { name: 'asc' },
  });
  let all: IStockReportRow[] = products.map((p) => {
    const stock = p.batches.reduce((sum, b) => sum + b.stock, 0);
    const stockValue = round2(p.batches.reduce((sum, b) => sum + b.stock * toNumber(b.purchasePrice), 0));
    let earliest: Date | null = null;
    for (const b of p.batches) {
      if (b.stock <= 0 || !b.expiryDate) continue;
      if (!earliest || b.expiryDate < earliest) earliest = b.expiryDate;
    }
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      productType: p.productType,
      unit: p.unit,
      stock,
      minStock: p.minStock,
      stockStatus: stockStatusOf(stock, p.minStock),
      stockValue,
      earliestExpiry: earliest ? earliest.toISOString().slice(0, 10) : null,
    };
  });
  if (search) {
    all = all.filter(
      (r) => r.name.toLowerCase().includes(search) || (r.sku ?? '').toLowerCase().includes(search),
    );
  }
  if (query.stockStatus) {
    all = all.filter((r) => r.stockStatus === query.stockStatus);
  }
  all.sort((a, b) => a.stock - b.stock);
  const total = all.length;
  const data = all.slice((page - 1) * limit, page * limit);
  const summary = {
    totalProducts: products.length,
    stockValue: round2(all.reduce((sum, r) => sum + r.stockValue, 0)),
    lowCount: all.filter((r) => r.stockStatus === 'Low Stock').length,
    criticalCount: all.filter((r) => r.stockStatus === 'Critical').length,
    outOfStockCount: all.filter((r) => r.stock === 0).length,
  };
  return { meta: metaOf(page, limit, total), summary, data };
};

const getExpiry = async (query: IReportFilters) => {
  const { page, limit } = paginate(query);
  const days = Math.max(1, Math.min(365, Number(query.days) || REPORT_DEFAULT_EXPIRY_DAYS));
  const search = query.searchTerm?.trim().toLowerCase();
  const todayStart = startOfDay(new Date());
  const windowEnd = new Date(todayStart);
  windowEnd.setDate(windowEnd.getDate() + days + 1);

  const batches = await prisma.productBatch.findMany({
    where: {
      stock: { gt: 0 },
      expiryDate: { not: null },
      product: { isDeleted: false },
    },
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { expiryDate: 'asc' },
  });
  let all: IExpiryReportRow[] = [];
  for (const b of batches) {
    if (!b.expiryDate) continue;
    const isExpired = b.expiryDate < todayStart;
    const isNear = !isExpired && b.expiryDate < windowEnd;
    if (!isExpired && !isNear) continue;
    const daysLeft = Math.ceil((b.expiryDate.getTime() - todayStart.getTime()) / 86_400_000);
    all.push({
      batchId: b.id,
      productId: b.productId,
      productName: b.product?.name ?? 'Unknown product',
      sku: b.product?.sku ?? null,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate.toISOString().slice(0, 10),
      stock: b.stock,
      status: isExpired ? 'Expired' : 'Near Expiry',
      daysLeft,
    });
  }
  if (query.expiryStatus) {
    all = all.filter((r) => r.status === query.expiryStatus);
  }
  if (search) {
    all = all.filter(
      (r) =>
        r.productName.toLowerCase().includes(search) ||
        (r.sku ?? '').toLowerCase().includes(search) ||
        (r.batchNumber ?? '').toLowerCase().includes(search),
    );
  }
  all.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Expired' ? -1 : 1;
    return a.daysLeft - b.daysLeft;
  });
  const total = all.length;
  const data = all.slice((page - 1) * limit, page * limit);
  return {
    meta: metaOf(page, limit, total),
    summary: {
      expiredBatches: all.filter((r) => r.status === 'Expired').length,
      nearExpiryBatches: all.filter((r) => r.status === 'Near Expiry').length,
    },
    data,
  };
};

export const ReportService = {
  getOverview,
  getSales,
  getPurchases,
  getProfitSummary,
  getProfitByProduct,
  getCustomerDues,
  getVendorDues,
  getStock,
  getExpiry,
};
