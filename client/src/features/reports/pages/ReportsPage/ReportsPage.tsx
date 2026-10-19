import { useState } from 'react';
import { Card, Tabs } from 'antd';
import dayjs from 'dayjs';
import {
  CustomerDuesSection,
  ExpirySection,
  ProfitSection,
  PurchasesSection,
  ReportFilters,
  ReportOverviewCards,
  SalesSection,
  StockSection,
  VendorDuesSection,
} from '../../components/index.ts';
import { useReportOverview } from '../../hooks/index.ts';
import type { ReportTabKey } from '../../types/index.ts';

const DEFAULT_FROM = dayjs().subtract(29, 'day').format('YYYY-MM-DD');
const DEFAULT_TO = dayjs().format('YYYY-MM-DD');

const SEARCH_PLACEHOLDERS: Record<ReportTabKey, string> = {
  sales: 'Search invoice, customer...',
  purchases: 'Search GRN, supplier...',
  profit: 'Search product...',
  'customer-dues': 'Search name, phone, area...',
  'vendor-dues': 'Search supplier...',
  stock: 'Search product, SKU...',
  expiry: 'Search product, batch...',
};

const DATELESS_TABS: ReportTabKey[] = ['customer-dues', 'vendor-dues', 'stock', 'expiry'];

function ReportsPage() {
  const [tab, setTab] = useState<ReportTabKey>('sales');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(DEFAULT_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_TO);

  const { data: overview, isLoading: isOverviewLoading } = useReportOverview({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  });

  const handleReset = () => {
    setSearch('');
    setDateFrom(DEFAULT_FROM);
    setDateTo(DEFAULT_TO);
  };

  const showReset = search !== '' || dateFrom !== DEFAULT_FROM || dateTo !== DEFAULT_TO;

  return (
    <div className="flex flex-col gap-4">
      <ReportOverviewCards overview={overview} loading={isOverviewLoading} />

      <Card title="Reports Console">
        <div className="mb-4">
          <ReportFilters
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={SEARCH_PLACEHOLDERS[tab]}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
            hideDates={DATELESS_TABS.includes(tab)}
            onReset={handleReset}
            showReset={showReset}
          />
        </div>

        <Tabs
          activeKey={tab}
          onChange={(key) => setTab(key as ReportTabKey)}
          destroyInactiveTabPane
          items={[
            {
              key: 'sales',
              label: 'Sales',
              children: <SalesSection dateFrom={dateFrom} dateTo={dateTo} search={search} />,
            },
            {
              key: 'purchases',
              label: 'Purchase',
              children: <PurchasesSection dateFrom={dateFrom} dateTo={dateTo} search={search} />,
            },
            {
              key: 'profit',
              label: 'Profit',
              children: <ProfitSection dateFrom={dateFrom} dateTo={dateTo} search={search} />,
            },
            {
              key: 'customer-dues',
              label: 'Customer Due',
              children: <CustomerDuesSection search={search} />,
            },
            {
              key: 'vendor-dues',
              label: 'Vendor Due',
              children: <VendorDuesSection search={search} />,
            },
            {
              key: 'stock',
              label: 'Stock',
              children: <StockSection search={search} />,
            },
            {
              key: 'expiry',
              label: 'Expiry',
              children: <ExpirySection search={search} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default ReportsPage;
