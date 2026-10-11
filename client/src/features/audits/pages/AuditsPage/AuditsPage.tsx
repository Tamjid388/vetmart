import { useState } from 'react';
import { Alert, Card } from 'antd';
import { AuditCardList } from '../../components/AuditCardList/index.ts';
import { AuditDetailDrawer } from '../../components/AuditDetailDrawer/index.ts';
import { AuditFilters } from '../../components/AuditFilters/index.ts';
import { AuditOverviewCards } from '../../components/AuditOverviewCards/index.ts';
import { AuditTable } from '../../components/AuditTable/index.ts';
import { DEFAULT_AUDIT_FILTERS, PAGE_SIZE } from '../../data/audit.constants.ts';
import { useAuditEventDetail } from '../../hooks/useAuditEventDetail/index.ts';
import { useAuditEvents } from '../../hooks/useAuditEvents/index.ts';
import { useAuditOverview } from '../../hooks/useAuditOverview/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { AuditEvent, AuditListFilters } from '../../types/index.ts';

function AuditsPage() {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<AuditListFilters>(DEFAULT_AUDIT_FILTERS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const overviewParams =
    filters.dateFrom || filters.dateTo
      ? {
          ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
          ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
        }
      : undefined;
  const { data: overview, isLoading: isOverviewLoading } = useAuditOverview(overviewParams);

  const { data, total, isLoading, error } = useAuditEvents({
    page,
    limit: PAGE_SIZE,
    sortOrder: 'desc',
    ...(filters.search ? { searchTerm: filters.search } : {}),
    ...(filters.module !== 'all' ? { module: filters.module } : {}),
    ...(filters.action !== 'all' ? { action: filters.action } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
  });

  const { data: detail, isLoading: isDetailLoading } = useAuditEventDetail(
    selected?.module,
    selected?.recordId,
  );

  const handleFiltersChange = (next: AuditListFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert
          type="error"
          showIcon
          message="Failed to load audit events"
          description={getApiErrorMessage(error, 'Failed to load audit events')}
        />
      )}
      <AuditOverviewCards overview={overview} loading={isOverviewLoading} />
      <Card title="Activity log (কার্যক্রম)">
        <div className="mb-4">
          <AuditFilters value={filters} onChange={handleFiltersChange} />
        </div>
        {isMobile ? (
          <AuditCardList
            data={data}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            loading={isLoading}
            onPageChange={setPage}
            onView={setSelected}
          />
        ) : (
          <AuditTable
            data={data}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            isLoading={isLoading}
            onPageChange={setPage}
            onView={setSelected}
          />
        )}
      </Card>
      <AuditDetailDrawer
        open={!!selected}
        event={selected}
        detail={detail}
        loading={isDetailLoading}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export default AuditsPage;
