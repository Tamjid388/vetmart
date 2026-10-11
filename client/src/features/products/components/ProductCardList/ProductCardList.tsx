import { Alert, Button, Card, Empty, Pagination, Skeleton } from 'antd';
import { PAGE_SIZE } from '../../data/product.constants.ts';
import type { ProductResponse } from '../../types/index.ts';
import ProductCard from './ProductCard.tsx';

type ProductCardListProps = {
  data: ProductResponse[];
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
  onView: (product: ProductResponse) => void;
  onEdit: (product: ProductResponse) => void;
  onDelete: (product: ProductResponse) => void;
  /** Cost (purchase price) is admin-only. Staff sees qty/selling only. */
  showCost?: boolean;
  /** True only on the very first load. Skeleton cards. */
  loading?: boolean;
  /** True on any background refetch (page / filter change with keepPreviousData). */
  isFetching?: boolean;
  /** True while the displayed rows are the previous page's data. */
  isPlaceholderData?: boolean;
  /** Non-null when the query failed — renders Alert + Retry like desktop. */
  error?: unknown;
  onRetry?: () => void;
};

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Latin digits → Bengali digits for mobile total text per `stockpage.png`. */
function toBengaliDigits(value: number): string {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]);
}

const LOADING_SKELETON_COUNT = 4;

function LoadingSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: LOADING_SKELETON_COUNT }, (_, index) => (
        <Card key={index} size="small" className="w-full">
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  );
}

/**
 * E8b mobile card list — presentational only, no data fetching.
 * Mirrors the desktop table's loading/error/empty/stale/pagination states
 * with the same `data/page/pageSize/total/onPageChange` props.
 */
function ProductCardList({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  showCost = false,
  loading = false,
  isFetching = false,
  isPlaceholderData = false,
  error = null,
  onRetry,
}: ProductCardListProps) {
  if (loading) {
    return <LoadingSkeletons />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load products"
        description={error instanceof Error ? error.message : 'Please try again.'}
        action={
          onRetry ? (
            <Button size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (data.length === 0) {
    return <Empty description="No products found" className="py-8" />;
  }

  // Same stale-dim rule as the table: dim during background refetches so the
  // UI never flashes empty while the next page/filter request is in flight.
  const showStaleDim = isPlaceholderData || isFetching;
  const rangeFrom = (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);

  return (
    <div className={showStaleDim ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className="flex flex-col gap-3">
        {data.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            showCost={showCost}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      {total > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Pagination
            simple
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
          />
          <div className="text-xs text-slate-500">
            দেখানো হচ্ছে {toBengaliDigits(rangeFrom)} থেকে {toBengaliDigits(rangeTo)} / মোট{' '}
            {toBengaliDigits(total)} টি পণ্য
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductCardList;
