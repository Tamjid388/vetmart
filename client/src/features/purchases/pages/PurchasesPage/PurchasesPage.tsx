import { useState } from 'react';
import { Button, Card, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { PurchaseFilters } from '../../components/PurchaseFilters/index.ts';
import { PurchaseCardList } from '../../components/PurchaseCardList/index.ts';
import { PurchaseTable } from '../../components/PurchaseTable/index.ts';
import { DEFAULT_PURCHASE_FILTERS, PAGE_SIZE } from '../../data/purchase.constants.ts';
import { usePurchases } from '../../hooks/usePurchases/index.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { PurchaseListFilters } from '../../types/index.ts';

function PurchasesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<PurchaseListFilters>(DEFAULT_PURCHASE_FILTERS);
  const [page, setPage] = useState(1);
  const { data, total, isPending, isFetching, isPlaceholderData } = usePurchases({
    searchTerm: filters.search.trim() || undefined,
    paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus,
    page,
    limit: PAGE_SIZE,
  });

  // keepPreviousData: old rows stay visible while the next page loads.
  const isInitialLoading = isPending;
  const isRefreshing = isFetching && !isPending;

  const handleFiltersChange = (next: PurchaseListFilters) => {
    setFilters(next);
    setPage(1);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => navigate('/purchases/new')}
        >
          New Purchase
        </Button>
        <PurchaseFilters value={filters} onChange={handleFiltersChange} />
        <div className={isPlaceholderData && !isInitialLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <PurchaseCardList
            data={data}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            loading={isInitialLoading}
            onPageChange={setPage}
            onView={(purchase) => navigate(`/purchases/${purchase.id}/edit`)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <PurchaseFilters value={filters} onChange={handleFiltersChange} />
          <div className="flex items-center gap-2 lg:ml-auto">
            {isRefreshing ? (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Spin size="small" /> Loading...
              </span>
            ) : null}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/purchases/new')}
            >
              New Purchase
            </Button>
          </div>
        </div>

        <div className={isPlaceholderData && !isInitialLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <PurchaseTable
            data={data}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            isLoading={isInitialLoading}
            onPageChange={setPage}
            onView={(purchase) => navigate(`/purchases/${purchase.id}/edit`)}
          />
        </div>
      </Card>
    </div>
  );
}

export default PurchasesPage;
