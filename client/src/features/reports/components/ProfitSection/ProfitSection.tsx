import { useState } from 'react';
import { Button, Card, Empty, Pagination, Skeleton, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useProfitByProduct, useProfitSummary } from '../../hooks/index.ts';
import type { ProfitByProductRow } from '../../types/index.ts';
import { downloadCsv, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const columns: TableColumnsType<ProfitByProductRow> = [
  {
    title: 'Product',
    dataIndex: 'productName',
    key: 'productName',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  {
    title: 'Qty',
    dataIndex: 'qtySold',
    key: 'qtySold',
    align: 'right',
    width: 70,
  },
  {
    title: 'Revenue',
    dataIndex: 'revenue',
    key: 'revenue',
    align: 'right',
    render: (value: number) => <span className="tabular-nums">{formatTaka(value)}</span>,
  },
  {
    title: 'COGS',
    dataIndex: 'cogs',
    key: 'cogs',
    align: 'right',
    render: (value: number) => <span className="tabular-nums text-slate-500">{formatTaka(value)}</span>,
  },
  {
    title: 'Profit',
    dataIndex: 'profit',
    key: 'profit',
    align: 'right',
    render: (value: number) => (
      <span className={`tabular-nums ${value >= 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}`}>
        {formatTaka(value)}
      </span>
    ),
  },
];

type ProfitSectionProps = {
  dateFrom: string;
  dateTo: string;
  search: string;
};

function ProfitSection({ dateFrom, dateTo, search }: ProfitSectionProps) {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);

  const rangeParams = {
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };
  const { data: summary, isLoading: isSummaryLoading } = useProfitSummary(rangeParams);
  const { data, total, isLoading, isFetching, isError, error } = useProfitByProduct({
    ...rangeParams,
    ...(search ? { searchTerm: search } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, ['productName', 'unit', 'qtySold', 'revenue', 'cogs', 'profit']);
    downloadCsv(`profit-by-product-p${page}`, csv);
  };

  const chartData = [...data].sort((a, b) => b.profit - a.profit).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      {isSummaryLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} size="small">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card size="small">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Revenue</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {formatTaka(summary?.revenue ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{summary?.transactionCount ?? 0} transactions</p>
          </Card>
          <Card size="small">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">COGS (FIFO)</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {formatTaka(summary?.cogs ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">lot-cost snapshots</p>
          </Card>
          <Card size="small">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Gross Profit</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-green-600">
              {formatTaka(summary?.grossProfit ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">revenue − COGS</p>
          </Card>
          <Card size="small">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Avg Order</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
              {formatTaka(summary?.avgOrderValue ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">discount {formatTaka(summary?.discount ?? 0)}</p>
          </Card>
        </div>
      )}

      {chartData.length > 0 && (
        <Card title="Top products by profit" size="small">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={110}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => [formatTaka(Number(value)), 'Profit']} />
                <Bar dataKey="profit" fill="#16A34A" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading || isFetching}>
        {isError ? (
          <Card>
            <Empty description={getApiErrorMessage(error, 'Failed to load profit report')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No profit data in this period" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.productId} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-800">{row.productName}</span>
                    <span
                      className={`font-semibold tabular-nums ${row.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {formatTaka(row.profit)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.qtySold} sold • revenue {formatTaka(row.revenue)} • COGS {formatTaka(row.cogs)}
                  </p>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<ProfitByProductRow>
            rowKey="productId"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 640 }}
            locale={{ emptyText: 'No profit data in this period' }}
          />
        )}
      </Spin>

      {total > PAGE_SIZE && (
        <Pagination
          current={page}
          pageSize={PAGE_SIZE}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
          className="self-center"
        />
      )}
    </div>
  );
}

export default ProfitSection;
