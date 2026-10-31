import { useState } from 'react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { LedgerFilters } from '../../components/LedgerFilters/index.ts';
import { LedgerTable } from '../../components/LedgerTable/index.ts';
import { LedgerCardList } from '../../components/LedgerCardList/index.ts';
import { useCustomerLedger } from '../../hooks/useCustomerLedger/index.ts';
import { LEDGER_PAGE_SIZE, type LedgerFiltersValue } from '../../types/index.ts';
import { formatTaka } from '../../../sales/utils/format.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultLast30Days(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { dateFrom: toISODate(from), dateTo: toISODate(to) };
}

function CustomerLedgerPage() {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<LedgerFiltersValue>({ name: '', ...defaultLast30Days() });
  const [page, setPage] = useState(1);

  const handleFiltersChange = (next: LedgerFiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const { data, total, isLoading } = useCustomerLedger({
    customerName: filters.name.trim() || undefined,
    area: filters.area || undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortBy: 'saleDate',
    sortOrder: 'desc',
    page,
    limit: LEDGER_PAGE_SIZE,
  });

  const totalBill = data.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const totalPaid = data.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalDue = data.reduce((sum, sale) => sum + sale.dueAmount, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4">
          <LedgerFilters value={filters} onChange={handleFiltersChange} />
        </div>
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Statistic title="মোট বিল" value={formatTaka(totalBill)} />
          </Col>
          <Col span={8}>
            <Statistic title="মোট জমা" value={formatTaka(totalPaid)} />
          </Col>
          <Col span={8}>
            <Statistic title="মোট বাকি" value={formatTaka(totalDue)} valueStyle={{ color: totalDue > 0 ? '#dc2626' : undefined }} />
          </Col>
        </Row>
        <Typography.Text type="secondary">Selected period only — মোট বাকি নয়</Typography.Text>
        <div className="mt-4">
          {isMobile ? (
            <LedgerCardList data={data} page={page} pageSize={LEDGER_PAGE_SIZE} total={total} loading={isLoading} onPageChange={setPage} />
          ) : (
            <LedgerTable data={data} page={page} pageSize={LEDGER_PAGE_SIZE} total={total} isLoading={isLoading} onPageChange={setPage} />
          )}
        </div>
      </Card>
    </div>
  );
}

export default CustomerLedgerPage;
