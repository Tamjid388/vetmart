import type {
  DashboardKpi,
  DueProgressItem,
  PurchaseSalesPoint,
  SalesPoint,
  SalesPeriod,
} from '../types/index.ts';

export const dashboardKpis: DashboardKpi[] = [
  { id: 'sales', title: "Today's Sales", value: 45230, changePercent: 12.4, goodWhen: 'up' },
  { id: 'purchase', title: "Today's Purchase", value: 32100, changePercent: 4.8, goodWhen: 'up' },
  { id: 'collection', title: "Today's Collection", value: 38750, changePercent: 8.2, goodWhen: 'up' },
  { id: 'due', title: "Today's Due", value: 6480, changePercent: -15.3, goodWhen: 'down' },
  { id: 'customerDue', title: 'Total Customer Due', value: 124500, changePercent: 2.1, goodWhen: 'down' },
  { id: 'vendorDue', title: 'Total Vendor Due', value: 215800, changePercent: -0.5, goodWhen: 'down' },
  { id: 'stockValue', title: 'Current Stock Value', value: 1845000, changePercent: 5.4, goodWhen: 'up' },
  { id: 'profit', title: "Today's Profit", value: 8920, changePercent: 18.7, goodWhen: 'up' },
];

export const salesByPeriod: Record<SalesPeriod, SalesPoint[]> = {
  today: [
    { label: '8 AM', sales: 2800 },
    { label: '10 AM', sales: 6200 },
    { label: '12 PM', sales: 9100 },
    { label: '2 PM', sales: 7400 },
    { label: '4 PM', sales: 11800 },
    { label: '6 PM', sales: 9800 },
    { label: '8 PM', sales: 4300 },
  ],
  week: [
    { label: 'Sat', sales: 38200 },
    { label: 'Sun', sales: 21400 },
    { label: 'Mon', sales: 41800 },
    { label: 'Tue', sales: 36500 },
    { label: 'Wed', sales: 45230 },
    { label: 'Thu', sales: 40100 },
    { label: 'Fri', sales: 43600 },
  ],
  month: [
    { label: 'Week 1', sales: 186000 },
    { label: 'Week 2', sales: 214500 },
    { label: 'Week 3', sales: 198200 },
    { label: 'Week 4', sales: 231800 },
  ],
};

export const purchaseVsSales: PurchaseSalesPoint[] = [
  { label: 'Sat', purchase: 28600, sales: 18200 },
  { label: 'Sun', purchase: 12400, sales: 21400 },
  { label: 'Mon', purchase: 24800, sales: 31800 },
  { label: 'Tue', purchase: 17600, sales: 26500 },
  { label: 'Wed', purchase: 30200, sales: 36100 },
];

export const dueProgress: DueProgressItem[] = [
  {
    id: 'customer',
    label: 'Customer Due Collected',
    collected: 38750,
    total: 45230,
    color: 'green',
  },
  {
    id: 'vendor',
    label: 'Vendor Due Settled',
    collected: 115000,
    total: 215800,
    color: 'orange',
  },
];
