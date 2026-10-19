import { useState } from 'react';
import { Button, Card, Empty, Pagination, Select, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { ExpiryBadge } from '../../../products/components/index.ts';
import { useExpiryReport } from '../../hooks/index.ts';
import type { ExpiryReportRow } from '../../types/index.ts';
import { downloadCsv, formatDateTime, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const columns: TableColumnsType<ExpiryReportRow> = [
  {
    title: 'Product',
    dataIndex: 'productName',
    key: 'productName',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  {
    title: 'Batch',
    dataIndex: 'batchNumber',
    key: 'batchNumber',
    width: 120,
    render: (value: string | null) => value ?? '—',
  },
  {
    title: 'Expiry',
    dataIndex: 'expiryDate',
    key: 'expiryDate',
    width: 130,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    align: 'right',
    width: 80,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 130,
    render: (value: ExpiryReportRow['status']) => <ExpiryBadge status={value} />,
  },
];

function ExpirySection({ search }: { search: string }) {
  const isMobile = useIsMobile();
  const [expiryStatus, setExpiryStatus] = useState<'all' | 'Expired' | 'Near Expiry'>('all');
  const [page, setPage] = useState(1);

  const { data, summary, total, isLoading, isFetching, isError, error } = useExpiryReport({
    ...(search ? { searchTerm: search } : {}),
    ...(expiryStatus !== 'all' ? { expiryStatus } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, [
      'productName',
      'sku',
      'batchNumber',
      'expiryDate',
      'stock',
      'status',
      'daysLeft',
    ]);
    downloadCsv(`expiry-report-p${page}`, csv);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Expired lots</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-red-500">{summary.expiredBatches}</p>
        </Card>
        <Card size="small">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Near expiry (20d)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-orange-500">
            {summary.nearExpiryBatches}
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select<'all' | 'Expired' | 'Near Expiry'>
          value={expiryStatus}
          onChange={(value) => {
            setExpiryStatus(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'Expired', label: 'Expired' },
            { value: 'Near Expiry', label: 'Near Expiry' },
          ]}
          className="sm:w-44"
        />
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading || isFetching}>
        {isError ? (
          <Card>
            <Empty description={getApiErrorMessage(error, 'Failed to load expiry report')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No expiry alerts" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.batchId} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-800">{row.productName}</span>
                    <ExpiryBadge status={row.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.batchNumber ? `Batch ${row.batchNumber} • ` : ''}{formatDateTime(row.expiryDate)} •{' '}
                    {row.stock} on hand
                  </p>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<ExpiryReportRow>
            rowKey="batchId"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 680 }}
            locale={{ emptyText: 'No expiry alerts' }}
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

export default ExpirySection;
