import { useState } from 'react';
import { Button, Card, Empty, Pagination, Select, Spin, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { usePurchasesReport } from '../../hooks/index.ts';
import type { PurchaseReportRow } from '../../types/index.ts';
import { downloadCsv, formatDateTime, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const statusColor = (status: string): string => {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'error';
};

const columns: TableColumnsType<PurchaseReportRow> = [
  {
    title: 'GRN',
    dataIndex: 'invoiceNo',
    key: 'invoiceNo',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  {
    title: 'Date',
    dataIndex: 'purchaseDate',
    key: 'purchaseDate',
    width: 130,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: 'Supplier',
    dataIndex: 'supplierName',
    key: 'supplierName',
    render: (value: string | null) => value ?? '—',
  },
  {
    title: 'Items',
    dataIndex: 'itemCount',
    key: 'itemCount',
    align: 'right',
    width: 70,
  },
  {
    title: 'Total',
    dataIndex: 'grandTotal',
    key: 'grandTotal',
    align: 'right',
    render: (value: number) => <span className="tabular-nums">{formatTaka(value)}</span>,
  },
  {
    title: 'Due',
    dataIndex: 'dueAmount',
    key: 'dueAmount',
    align: 'right',
    render: (value: number) => (
      <span className={value > 0 ? 'font-semibold text-red-500 tabular-nums' : 'tabular-nums text-slate-500'}>
        {formatTaka(value)}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    width: 100,
    render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>,
  },
];

type PurchasesSectionProps = {
  dateFrom: string;
  dateTo: string;
  search: string;
};

function PurchasesSection({ dateFrom, dateTo, search }: PurchasesSectionProps) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'all' | 'PAID' | 'PARTIAL' | 'DUE'>('all');
  const [page, setPage] = useState(1);

  const { data, total, isLoading, isFetching, isError, error } = usePurchasesReport({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(search ? { searchTerm: search } : {}),
    ...(status !== 'all' ? { paymentStatus: status } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, [
      'invoiceNo',
      'purchaseDate',
      'supplierName',
      'grandTotal',
      'paidAmount',
      'dueAmount',
      'paymentStatus',
      'itemCount',
    ]);
    downloadCsv(`purchase-report-p${page}`, csv);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select<'all' | 'PAID' | 'PARTIAL' | 'DUE'>
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'DUE', label: 'Due' },
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
            <Empty description={getApiErrorMessage(error, 'Failed to load purchase report')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No purchases in this period" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.id} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{row.invoiceNo}</span>
                    <Tag color={statusColor(row.paymentStatus)}>{row.paymentStatus}</Tag>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-500">
                      {row.supplierName ?? '—'} • {formatDateTime(row.purchaseDate)}
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {formatTaka(row.grandTotal)}
                    </span>
                  </div>
                  {row.dueAmount > 0 && (
                    <p className="mt-1 text-xs text-red-500">Due {formatTaka(row.dueAmount)}</p>
                  )}
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<PurchaseReportRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'No purchases in this period' }}
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

export default PurchasesSection;
