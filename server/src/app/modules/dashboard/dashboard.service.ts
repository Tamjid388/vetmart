import { prisma } from '../../shared/prisma.js';
import {
  DASHBOARD_ALERT_LIMIT,
  DASHBOARD_CRITICAL_RATIO,
  DASHBOARD_NEAR_EXPIRY_DAYS,
} from './dashboard.constant.js';
import type {
  TDashboardDueProgressItem,
  TDashboardExpiryRow,
  TDashboardKpi,
  TDashboardLowStockRow,
  TDashboardPurchaseSalesPoint,
  TDashboardRole,
  TDashboardSalesPoint,
  TDashboardSummary,
} from './dashboard.interface.js';

const toNumber = (v: unknown): number => Number((v as number | string) ?? 0);

const round1 = (n: number): number => Math.round((n + Number.EPSILON) * 10) / 10;
const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number): Date => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

const changePercent = (today: number, yesterday: number): number => {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return round1(((today - yesterday) / Math.abs(yesterday)) * 100);
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Today slots mirror the prototype labels so existing charts keep working. */
const TODAY_SLOTS: { label: string; startHour: number; endHour: number }[] = [
  { label: '8 AM', startHour: 0, endHour: 9 },
  { label: '10 AM', startHour: 9, endHour: 11 },
  { label: '12 PM', startHour: 11, endHour: 13 },
  { label: '2 PM', startHour: 13, endHour: 15 },
  { label: '4 PM', startHour: 15, endHour: 17 },
  { label: '6 PM', startHour: 17, endHour: 19 },
  { label: '8 PM', startHour: 19, endHour: 24 },
];

const stockStatusOf = (stock: number, minStock: number): 'In Stock' | 'Low Stock' | 'Critical' => {
  if (minStock <= 0) return 'In Stock';
  if (stock <= DASHBOARD_CRITICAL_RATIO * minStock) return 'Critical';
  if (stock <= minStock) return 'Low Stock';
  return 'In Stock';
};

const expiryStatusOf = (earliest: Date | null, todayStart: Date): 'Active' | 'Near Expiry' | 'Expired' => {
  if (!earliest) return 'Active';
  if (earliest < todayStart) return 'Expired';
  const windowEnd = addDays(todayStart, DASHBOARD_NEAR_EXPIRY_DAYS + 1);
  if (earliest < windowEnd) return 'Near Expiry';
  return 'Active';
};

const dayKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const getSummary = async (role: TDashboardRole): Promise<TDashboardSummary> => {
  const isAdmin = role === 'admin';
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);
  const weekStart = addDays(todayStart, -6);
  const monthStart = addDays(todayStart, -27);
  const last30Start = addDays(todayStart, -29);

  const activeSaleWhere = { isDeleted: false };
  const activePurchaseWhere = { isDeleted: false };
  const activePaymentWhere = { isDeleted: false };

  const [
    salesTodayAgg,
    salesYesterdayAgg,
    purchasesTodayAgg,
    purchasesYesterdayAgg,
    collectionTodayAgg,
    collectionYesterdayAgg,
    dueTodayAgg,
    dueYesterdayAgg,
    customerDueAgg,
    vendorDueAgg,
    profitTodayItems,
    profitYesterdayItems,
    salesTodayRows,
    salesLast28,
    purchasesLast28,
    customerCollected30,
    vendorPaid30,
    products,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { ...activeSaleWhere, saleDate: { gte: todayStart, lt: tomorrowStart } },
      _sum: { grandTotal: true },
    }),
    prisma.sale.aggregate({
      where: { ...activeSaleWhere, saleDate: { gte: yesterdayStart, lt: todayStart } },
      _sum: { grandTotal: true },
    }),
    prisma.purchase.aggregate({
      where: { ...activePurchaseWhere, purchaseDate: { gte: todayStart, lt: tomorrowStart } },
      _sum: { grandTotal: true },
    }),
    prisma.purchase.aggregate({
      where: { ...activePurchaseWhere, purchaseDate: { gte: yesterdayStart, lt: todayStart } },
      _sum: { grandTotal: true },
    }),
    prisma.payment.aggregate({
      where: { ...activePaymentWhere, paidAt: { gte: todayStart, lt: tomorrowStart } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { ...activePaymentWhere, paidAt: { gte: yesterdayStart, lt: todayStart } },
      _sum: { amount: true },
    }),
    prisma.sale.aggregate({
      where: { ...activeSaleWhere, saleDate: { gte: todayStart, lt: tomorrowStart } },
      _sum: { dueAmount: true },
    }),
    prisma.sale.aggregate({
      where: { ...activeSaleWhere, saleDate: { gte: yesterdayStart, lt: todayStart } },
      _sum: { dueAmount: true },
    }),
    prisma.customer.aggregate({
      where: { isDeleted: false },
      _sum: { dueBalance: true },
    }),
    prisma.supplier.aggregate({
      where: { isDeleted: false },
      _sum: { payableBalance: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { ...activeSaleWhere, saleDate: { gte: todayStart, lt: tomorrowStart } } },
      select: { qty: true, sellingPrice: true, purchasePrice: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { ...activeSaleWhere, saleDate: { gte: yesterdayStart, lt: todayStart } } },
      select: { qty: true, sellingPrice: true, purchasePrice: true },
    }),
    prisma.sale.findMany({
      where: { ...activeSaleWhere, saleDate: { gte: todayStart, lt: tomorrowStart } },
      select: { saleDate: true, grandTotal: true },
    }),
    prisma.sale.findMany({
      where: { ...activeSaleWhere, saleDate: { gte: monthStart, lt: tomorrowStart } },
      select: { saleDate: true, grandTotal: true },
    }),
    prisma.purchase.findMany({
      where: { ...activePurchaseWhere, purchaseDate: { gte: monthStart, lt: tomorrowStart } },
      select: { purchaseDate: true, grandTotal: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...activePaymentWhere,
        customerId: { not: null },
        paidAt: { gte: last30Start, lt: tomorrowStart },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        ...activePaymentWhere,
        supplierId: { not: null },
        paidAt: { gte: last30Start, lt: tomorrowStart },
      },
      _sum: { amount: true },
    }),
    prisma.product.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        minStock: true,
        batches: { select: { stock: true, expiryDate: true, purchasePrice: true } },
      },
    }),
  ]);

  const salesToday = round2(toNumber(salesTodayAgg._sum.grandTotal ?? 0));
  const salesYesterday = round2(toNumber(salesYesterdayAgg._sum.grandTotal ?? 0));
  const purchaseToday = round2(toNumber(purchasesTodayAgg._sum.grandTotal ?? 0));
  const purchaseYesterday = round2(toNumber(purchasesYesterdayAgg._sum.grandTotal ?? 0));
  const collectionToday = round2(toNumber(collectionTodayAgg._sum.amount ?? 0));
  const collectionYesterday = round2(toNumber(collectionYesterdayAgg._sum.amount ?? 0));
  const dueToday = round2(toNumber(dueTodayAgg._sum.dueAmount ?? 0));
  const dueYesterday = round2(toNumber(dueYesterdayAgg._sum.dueAmount ?? 0));
  const customerDue = round2(toNumber(customerDueAgg._sum.dueBalance ?? 0));
  const vendorDue = round2(toNumber(vendorDueAgg._sum.payableBalance ?? 0));

  // FIFO-actual profit from per-lot cost snapshots (SRS GAP-1: snapshot basis).
  const profitOf = (rows: { qty: number; sellingPrice: unknown; purchasePrice: unknown }[]): number =>
    round2(
      rows.reduce(
        (sum, r) => sum + (toNumber(r.sellingPrice) - toNumber(r.purchasePrice)) * r.qty,
        0,
      ),
    );
  const profitToday = profitOf(profitTodayItems);
  const profitYesterday = profitOf(profitYesterdayItems);

  // Stock value at lot cost (FIFO lots). Admin-only downstream.
  let stockValue = 0;
  for (const p of products) {
    for (const b of p.batches) {
      stockValue += b.stock * toNumber(b.purchasePrice);
    }
  }
  stockValue = round2(stockValue);

  const kpis: TDashboardKpi[] = [
    {
      id: 'sales',
      title: "Today's Sales",
      value: salesToday,
      changePercent: changePercent(salesToday, salesYesterday),
      goodWhen: 'up',
    },
    {
      id: 'collection',
      title: "Today's Collection",
      value: collectionToday,
      changePercent: changePercent(collectionToday, collectionYesterday),
      goodWhen: 'up',
    },
    {
      id: 'due',
      title: "Today's Due",
      value: dueToday,
      changePercent: changePercent(dueToday, dueYesterday),
      goodWhen: 'down',
    },
    { id: 'customerDue', title: 'Total Customer Due', value: customerDue, changePercent: 0, goodWhen: 'down' },
  ];
  if (isAdmin) {
    kpis.splice(
      1,
      0,
      {
        id: 'purchase',
        title: "Today's Purchase",
        value: purchaseToday,
        changePercent: changePercent(purchaseToday, purchaseYesterday),
        goodWhen: 'up',
      },
    );
    kpis.push(
      { id: 'vendorDue', title: 'Total Vendor Due', value: vendorDue, changePercent: 0, goodWhen: 'down' },
      { id: 'stockValue', title: 'Current Stock Value', value: stockValue, changePercent: 0, goodWhen: 'up' },
      {
        id: 'profit',
        title: "Today's Profit",
        value: profitToday,
        changePercent: changePercent(profitToday, profitYesterday),
        goodWhen: 'up',
      },
    );
  }

  // --- Sales by period -------------------------------------------------------
  const todayBuckets = TODAY_SLOTS.map((s) => ({ label: s.label, sales: 0 }));
  for (const row of salesTodayRows) {
    const hour = row.saleDate.getHours();
    const idx = TODAY_SLOTS.findIndex((s) => hour >= s.startHour && hour < s.endHour);
    if (idx >= 0 && todayBuckets[idx]) {
      const bucket = todayBuckets[idx] as TDashboardSalesPoint;
      bucket.sales = round2(bucket.sales + toNumber(row.grandTotal));
    }
  }

  const salesByDay = new Map<string, number>();
  for (const row of salesLast28) {
    const key = dayKey(row.saleDate);
    salesByDay.set(key, round2((salesByDay.get(key) ?? 0) + toNumber(row.grandTotal)));
  }
  const week: TDashboardSalesPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = addDays(todayStart, -i);
    week.push({
      label: WEEKDAY_SHORT[d.getDay()] as string,
      sales: salesByDay.get(dayKey(d)) ?? 0,
    });
  }
  const month: TDashboardSalesPoint[] = [
    { label: 'Week 1', sales: 0 },
    { label: 'Week 2', sales: 0 },
    { label: 'Week 3', sales: 0 },
    { label: 'Week 4', sales: 0 },
  ];
  for (let i = 27; i >= 0; i -= 1) {
    const d = addDays(todayStart, -i);
    const bucketIdx = i >= 21 ? 0 : i >= 14 ? 1 : i >= 7 ? 2 : 3;
    const bucket = month[bucketIdx] as TDashboardSalesPoint;
    bucket.sales = round2(bucket.sales + (salesByDay.get(dayKey(d)) ?? 0));
  }

  // --- Purchase vs sales (last 7 days) ---------------------------------------
  const purchaseByDay = new Map<string, number>();
  for (const row of purchasesLast28) {
    const key = dayKey(row.purchaseDate);
    purchaseByDay.set(key, round2((purchaseByDay.get(key) ?? 0) + toNumber(row.grandTotal)));
  }
  const purchaseVsSales: TDashboardPurchaseSalesPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = addDays(todayStart, -i);
    const key = dayKey(d);
    purchaseVsSales.push({
      label: WEEKDAY_SHORT[d.getDay()] as string,
      purchase: isAdmin ? (purchaseByDay.get(key) ?? 0) : 0,
      sales: salesByDay.get(key) ?? 0,
    });
  }

  // --- Due progress (last-30d collection vs outstanding) ----------------------
  const customerCollected = round2(toNumber(customerCollected30._sum.amount ?? 0));
  const vendorPaid = round2(toNumber(vendorPaid30._sum.amount ?? 0));
  const customerTotal = round2(customerCollected + customerDue);
  const vendorTotal = round2(vendorPaid + vendorDue);
  const dueProgress: TDashboardDueProgressItem[] = [
    {
      id: 'customer',
      label: 'Customer Due Collected',
      collected: customerCollected,
      total: customerTotal,
      color: 'green',
    },
  ];
  if (isAdmin) {
    dueProgress.push({
      id: 'vendor',
      label: 'Vendor Due Settled',
      collected: vendorPaid,
      total: vendorTotal,
      color: 'orange',
    });
  }

  // --- Low stock + expiry alerts ----------------------------------------------
  const lowStockAll: TDashboardLowStockRow[] = [];
  const expiryAll: TDashboardExpiryRow[] = [];
  for (const p of products) {
    const stock = p.batches.reduce((sum, b) => sum + b.stock, 0);
    const status = stockStatusOf(stock, p.minStock);
    if (status !== 'In Stock') {
      lowStockAll.push({ id: p.id, name: p.name, minStock: p.minStock, stock, status });
    }
    let earliest: Date | null = null;
    for (const b of p.batches) {
      if (b.stock <= 0 || !b.expiryDate) continue;
      if (!earliest || b.expiryDate < earliest) earliest = b.expiryDate;
    }
    const expiryStatus = expiryStatusOf(earliest, todayStart);
    if (expiryStatus !== 'Active' && earliest) {
      expiryAll.push({
        id: p.id,
        name: p.name,
        expiryDate: earliest.toISOString().slice(0, 10),
        status: expiryStatus,
      });
    }
  }
  lowStockAll.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Critical' ? -1 : 1;
    const ra = a.minStock > 0 ? a.stock / a.minStock : 1;
    const rb = b.minStock > 0 ? b.stock / b.minStock : 1;
    return ra - rb;
  });
  expiryAll.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Expired' ? -1 : 1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });
  const lowStock: TDashboardLowStockRow[] = lowStockAll.slice(0, DASHBOARD_ALERT_LIMIT);
  const expiryAlerts: TDashboardExpiryRow[] = expiryAll.slice(0, DASHBOARD_ALERT_LIMIT);

  void weekStart;

  return {
    kpis,
    salesByPeriod: { today: todayBuckets, week, month },
    purchaseVsSales,
    dueProgress,
    lowStock,
    expiryAlerts,
  };
};

export const DashboardService = {
  getSummary,
};
