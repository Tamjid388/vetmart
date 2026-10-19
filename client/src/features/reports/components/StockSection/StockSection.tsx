import { useState } from 'react';
import { Button, Card, Empty, Pagination, Select, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { StockBadge } from '../../../products/components/index.ts';
import { useStockReport } from '../../hooks/index.ts';
import type { StockReportRow } from '../../types/index.ts';
import { downloadCsv, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const columns: TableColumnsType<StockReportRow> = [
  {
    title: 'Product',
    dataIndex: 'name',
    key: 'name',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    align: 'right',
    width: 80,
    render: (value: number, row) => (
      <span className={row.stockStatus === 'Critical' ? 'font-semibold text-red-500' : 'text-slate-700'}>
        {value}
      </span>
    ),
  },
  {
    title: 'Value',
    dataIndex: 'stockValue',
    key: 'stockValue',
    align: 'right',
    width: 120,
    render: (value: number) => <span className="tabular-nums">{formatTaka(value)}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'stockStatus',
    key: 'stockStatus',
    width: 120,
    render: (value: StockReportRow['stockStatus']) => <StockBadge status={value} />,
  },
];

function StockSection({ search }: { search: string }) {
  const isMobile = useIsMobile();
  const [productType, setProductType] = useState<'all' | 'MEDICINE' | 'FEED'>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'In Stock' | 'Low Stock' | 'Critical'>('all');
  const [page, setPage] = useState(1);

  const { data, summary, total, isLoading, isFetching, isError, error } = useStockReport({
    ...(search ? { searchTerm: search } : {}),
    ...(productType !== 'all' ? { productType } : {}),
    ...(stockStatus !== 'all' ? { stockStatus } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, [
      'name',
      'sku',
      'productType',
      'unit',
      'stock',
      'minStock',
      'stockStatus',
      'stockValue',
      'earliestExpiry',
    ]);
    downloadCsv(`stock-report-p${page}`, csv);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Stock value</p>
          <p className="mt-1 truncate text-lg font-semibold tabular-nums text-slate-900">
            {formatTaka(summary.stockValue)}
          </p>
        </Card>
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Products</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{summary.totalProducts}</p>
        </Card>
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Low / Critical</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
            {summary.lowCount} / <span className="text-red-500">{summary.criticalCount}</span>
          </p>
        </Card>
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Out of stock</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{summary.outOfStockCount}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select<'all' | 'MEDICINE' | 'FEED'>
            value={productType}
            onChange={(value) => {
              setProductType(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'MEDICINE', label: 'Medicine' },
              { value: 'FEED', label: 'Feed' },
            ]}
            className="sm:w-40"
          />
          <Select<'all' | 'In Stock' | 'Low Stock' | 'Critical'>
            value={stockStatus}
            onChange={(value) => {
              setStockStatus(value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Critical', label: 'Critical' },
            ]}
            className="sm:w-44"
          />
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading || isFetching}>
        {isError ? (
          <Card>
            <Empty description={getApiErrorMessage(error, 'Failed to load stock report')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No products match" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.id} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-800">{row.name}</span>
                    <StockBadge status={row.stockStatus} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.stock} {row.unit} • value {formatTaka(row.stockValue)}
                  </p>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<StockReportRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 640 }}
            locale={{ emptyText: 'No products match' }}
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

export default StockSection;
