import { Alert, Button, Card, Skeleton } from 'antd';
import { useMe } from '../../../auth/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import {
  DashboardSummary,
  DueProgress,
  ExpiryAlert,
  LowStockAlert,
  PurchaseVsSalesChart,
  SalesOverviewChart,
} from '../../components/index.ts';
import { useDashboard } from '../../hooks/useDashboard/index.ts';

function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { isAdmin } = useMe();
  const {
    kpis,
    salesByPeriod,
    purchaseVsSales,
    dueProgress,
    lowStock,
    expiryAlerts,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboard();

  if (isLoading) return <DashboardLoading />;

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load dashboard"
        description={getApiErrorMessage(error, 'Failed to load dashboard')}
        action={
          <Button size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardSummary kpis={kpis} />

      {isAdmin ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SalesOverviewChart dataByPeriod={salesByPeriod} />
          <PurchaseVsSalesChart data={purchaseVsSales} />
        </div>
      ) : (
        <SalesOverviewChart dataByPeriod={salesByPeriod} />
      )}

      <DueProgress items={dueProgress} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LowStockAlert data={lowStock} />
        <ExpiryAlert data={expiryAlerts} />
      </div>
    </div>
  );
}

export default DashboardPage;
