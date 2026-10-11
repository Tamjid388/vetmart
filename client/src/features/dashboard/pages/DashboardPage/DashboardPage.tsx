import {
  DashboardSummary,
  DueProgress,
  ExpiryAlert,
  LowStockAlert,
  PurchaseVsSalesChart,
  SalesOverviewChart,
} from '../../components/index.ts';
import { useDashboard } from '../../hooks/useDashboard/index.ts';

function DashboardPage() {
  const { kpis, salesByPeriod, purchaseVsSales, dueProgress, lowStock, expiryAlerts } =
    useDashboard();

  return (
    <div className="flex flex-col gap-4">
      <DashboardSummary kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SalesOverviewChart dataByPeriod={salesByPeriod} />
        <PurchaseVsSalesChart data={purchaseVsSales} />
      </div>

      <DueProgress items={dueProgress} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LowStockAlert data={lowStock} />
        <ExpiryAlert data={expiryAlerts} />
      </div>
    </div>
  );
}

export default DashboardPage;
