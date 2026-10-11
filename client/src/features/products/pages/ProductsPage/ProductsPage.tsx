import { useState } from 'react';
import { Alert, App, Button, Card, Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { ProductFilters } from '../../components/ProductFilters/index.ts';
import { ProductTable } from '../../components/ProductTable/index.ts';
import { ProductCardList } from '../../components/ProductCardList/index.ts';
import { DEFAULT_PRODUCT_FILTERS, PAGE_SIZE } from '../../data/product.constants.ts';
import { useProductMutations } from '../../hooks/useProductMutations/index.ts';
import { useProducts } from '../../hooks/useProducts/index.ts';
import { useMe } from '../../../auth/index.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { ProductListFilters } from '../../types/index.ts';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Latin digits → Bengali digits for the mobile header count per `stockpage.png`. */
function toBengaliDigits(value: number): string {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]);
}

function ProductsPage() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { isAdmin } = useMe();
  const isMobile = useIsMobile();
  const { deleteProduct } = useProductMutations();
  const [filters, setFilters] = useState<ProductListFilters>(DEFAULT_PRODUCT_FILTERS);
  const [page, setPage] = useState(1);

  // Single data hook for both views — mobile/desktop switch below is a
  // ternary (only one view mounted), so breakpoint flips re-render from the
  // React Query cache instead of refetching.
  const { data, total, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    useProducts({
      page,
      limit: PAGE_SIZE,
      searchTerm: filters.search || undefined,
    });

  // With keepPreviousData, `data` stays populated while the next page/filter
  // request is in flight. Only the very first load has no data (isPending).
  // Background refetches surface via isFetching / isPlaceholderData.
  const isInitialLoading = isPending;
  const isRefreshing = isFetching && !isPending;
  const handleFiltersChange = (next: ProductListFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleDelete = (product: { id: string; name: string }) => {
    modal.confirm({
      title: 'Delete product',
      content: `Delete "${product.name}"? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteProduct(product.id);
        message.success('Product deleted');
      },
    });
  };

  // E8b mobile view per `stockpage.png`: title + count + add button,
  // full-width search + scrollable chips, card list with compact pagination.
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 leading-tight">
            <Typography.Title level={4} className="!mb-0">
              স্টক (Stock)
            </Typography.Title>
            <div className="text-xs text-slate-500">{toBengaliDigits(total)} টি পণ্য</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isRefreshing ? (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Spin size="small" />
              </span>
            ) : null}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/products/new')}
            >
              পণ্য যোগ
            </Button>
          </div>
        </div>

        <ProductFilters
          variant="mobile-chips"
          value={filters}
          onChange={handleFiltersChange}
        />

        <ProductCardList
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          showCost={isAdmin}
          loading={isInitialLoading}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          error={isError ? error : null}
          onRetry={() => refetch()}
          onPageChange={setPage}
          onView={(product) => navigate(`/products/${product.id}`)}
          onEdit={(product) => navigate(`/products/${product.id}/edit`)}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <ProductFilters value={filters} onChange={handleFiltersChange} />
          <div className="flex items-center gap-2 lg:ml-auto">
            {isRefreshing ? (
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Spin size="small" /> Loading...
              </span>
            ) : null}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/products/new')}
            >
              Add Product
            </Button>
          </div>
        </div>

        {isError ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load products"
            description={error instanceof Error ? error.message : 'Please try again.'}
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <ProductTable
            data={data}
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            showCost={isAdmin}
            loading={isInitialLoading}
            isFetching={isFetching}
            isPlaceholderData={isPlaceholderData}
            onPageChange={setPage}
            onView={(product) => navigate(`/products/${product.id}`)}
            onEdit={(product) => navigate(`/products/${product.id}/edit`)}
            onDelete={handleDelete}
          />
        )}
      </Card>
    </div>
  );
}

export default ProductsPage;
