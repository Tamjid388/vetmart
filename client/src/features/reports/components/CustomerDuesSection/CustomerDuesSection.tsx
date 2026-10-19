import { useState } from 'react';
import { Button, Card, Empty, Input, Pagination, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useCustomerDues } from '../../hooks/index.ts';
import type { CustomerDueRow } from '../../types/index.ts';
import { downloadCsv, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const columns: TableColumnsType<CustomerDueRow> = [
  {
    title: 'Customer',
    dataIndex: 'name',
    key: 'name',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
  {
    title: 'Area',
    dataIndex: 'area',
    key: 'area',
    width: 120,
    render: (value: string | null) => value ?? '—',
  },
  {
    title: 'Due',
    dataIndex: 'dueBalance',
    key: 'dueBalance',
    align: 'right',
    render: (value: number) => (
      <span className="font-semibold tabular-nums text-red-500">{formatTaka(value)}</span>
    ),
  },
];

function CustomerDuesSection({ search }: { search: string }) {
  const isMobile = useIsMobile();
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);

  const { data, summary, total, isLoading, isFetching, isError, error } = useCustomerDues({
    ...(search ? { searchTerm: search } : {}),
    ...(area ? { area } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, ['name', 'phone', 'area', 'category', 'dueBalance']);
    downloadCsv(`customer-dues-p${page}`, csv);
  };

  return (
    <div className="flex flex-col gap-3">
      <Card size="small" className="border-slate-200">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Total outstanding
          </p>
          <p className="text-xl font-semibold tabular-nums text-red-500">
            {formatTaka(summary.totalDue)}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-400">{total} customers owe</p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          allowClear
          placeholder="Filter by area..."
          value={area}
          onChange={(e) => {
            setArea(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading || isFetching}>
        {isError ? (
          <Card>
            <Empty description={getApiErrorMessage(error, 'Failed to load customer dues')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No customer dues" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.id} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-800">{row.name}</span>
                    <span className="font-semibold tabular-nums text-red-500">
                      {formatTaka(row.dueBalance)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {row.phone}{row.area ? ` • ${row.area}` : ''}
                  </p>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<CustomerDueRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 640 }}
            locale={{ emptyText: 'No customer dues' }}
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

export default CustomerDuesSection;
