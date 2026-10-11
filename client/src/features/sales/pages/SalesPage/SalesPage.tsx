import { useState } from 'react';
import { Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { SaleFilters } from '../../components/SaleFilters/index.ts';
import { SaleCardList } from '../../components/SaleCardList/index.ts';
import { SaleTable } from '../../components/SaleTable/index.ts';
import { DEFAULT_SALE_FILTERS, PAGE_SIZE } from '../../data/sale.constants.ts';
import { useSales } from '../../hooks/useSales/index.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { SaleListFilters } from '../../types/index.ts';

function SalesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<SaleListFilters>(DEFAULT_SALE_FILTERS);
  const [page, setPage] = useState(1);
  const { data, total, isLoading } = useSales({
    searchTerm: filters.search.trim() || undefined,
    paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus,
    saleType: filters.saleType === 'all' ? undefined : filters.saleType,
    page,
    limit: PAGE_SIZE,
  });

  const handleFiltersChange = (next: SaleListFilters) => {
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
          onClick={() => navigate('/sales/new')}
        >
          New Sale
        </Button>
        <SaleFilters value={filters} onChange={handleFiltersChange} />
        <SaleCardList
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          loading={isLoading}
          onPageChange={setPage}
          onView={(sale) => navigate(`/sales/${sale.id}/edit`)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <SaleFilters value={filters} onChange={handleFiltersChange} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="lg:ml-auto"
            onClick={() => navigate('/sales/new')}
          >
            New Sale
          </Button>
        </div>

        <SaleTable
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
          onView={(sale) => navigate(`/sales/${sale.id}/edit`)}
        />
      </Card>
    </div>
  );
}

export default SalesPage;
