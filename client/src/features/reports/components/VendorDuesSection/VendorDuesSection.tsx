import { useState } from 'react';
import { Button, Card, Empty, Pagination, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useVendorDues } from '../../hooks/index.ts';
import type { VendorDueRow } from '../../types/index.ts';
import { downloadCsv, formatTaka, rowsToCsv } from '../../utils/index.ts';

const PAGE_SIZE = 10;

const columns: TableColumnsType<VendorDueRow> = [
  {
    title: 'Supplier',
    dataIndex: 'companyName',
    key: 'companyName',
    render: (value: string) => <span className="font-medium text-slate-800">{value}</span>,
  },
  { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 140 },
  {
    title: 'Payable',
    dataIndex: 'payableBalance',
    key: 'payableBalance',
    align: 'right',
    render: (value: number) => (
      <span className="font-semibold tabular-nums text-orange-600">{formatTaka(value)}</span>
    ),
  },
];

function VendorDuesSection({ search }: { search: string }) {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);

  const { data, summary, total, isLoading, isFetching, isError, error } = useVendorDues({
    ...(search ? { searchTerm: search } : {}),
    page,
    limit: PAGE_SIZE,
  });

  const handleExport = () => {
    const csv = rowsToCsv(data, ['companyName', 'phone', 'payableBalance']);
    downloadCsv(`vendor-dues-p${page}`, csv);
  };

  return (
    <div className="flex flex-col gap-3">
      <Card size="small" className="border-slate-200">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Total payable
          </p>
          <p className="text-xl font-semibold tabular-nums text-orange-600">
            {formatTaka(summary.totalDue)}
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-400">{total} suppliers owed</p>
      </Card>

      <div className="flex justify-end">
        <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={data.length === 0}>
          Export CSV
        </Button>
      </div>

      <Spin spinning={isLoading || isFetching}>
        {isError ? (
          <Card>
            <Empty description={getApiErrorMessage(error, 'Failed to load vendor dues')} />
          </Card>
        ) : isMobile ? (
          <div className="flex flex-col gap-2">
            {data.length === 0 ? (
              <Card>
                <Empty description="No vendor dues" />
              </Card>
            ) : (
              data.map((row) => (
                <Card key={row.id} size="small">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-800">{row.companyName}</span>
                    <span className="font-semibold tabular-nums text-orange-600">
                      {formatTaka(row.payableBalance)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{row.phone}</p>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Table<VendorDueRow>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={data}
            pagination={false}
            scroll={{ x: 560 }}
            locale={{ emptyText: 'No vendor dues' }}
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

export default VendorDuesSection;
