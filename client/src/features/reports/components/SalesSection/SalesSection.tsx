import { useState } from 'react';
import { Button, Card, Empty, Pagination, Select, Spin, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useSalesReport } from '../../hooks/index.ts';
import type { SalesReportRow } from '../../types/index.ts';
import { downloadCsv, formatDateTime, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const statusColor = (status: string): string => {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'error';
};

const columns: TableColumnsType<SalesReportRow> = [
  {
    title: 'Invoice',
    dataIndex: 'invoiceNo',
    key: 'invoiceNo',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  {
    title: 'Date',
    dataIndex: 'saleDate',
    key: 'saleDate',
    width: 130,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
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

type SalesSectionProps = {
  dateFrom: string;
  dateTo: string;
  search: string;
};

function SalesSection({ dateFrom, dateTo, search }: SalesSectionProps) {
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'all' | 'PAID' | 'PARTIAL' | 'DUE'>('all');
  const [page, setPage] = useState(1);

  const { data, total, isLoading, isFetching, isError, error } = useSalesReport({
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
      'saleDate',
      'customerName',
      'grandTotal',
      'paidAmount',
      'dueAmount',
      'paymentStatus',
      'itemCount',
    ]);
    downloadCsv(`sales-report-p${page}`, csv);
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
            <Empty description={getApiErrorMessage(error, 'Failed to load sales report')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No sales in this period" />
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
                      {row.customerName ?? '—'} • {formatDateTime(row.saleDate)}
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
          <Table<SalesReportRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'No sales in this period' }}
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

export default SalesSection;
