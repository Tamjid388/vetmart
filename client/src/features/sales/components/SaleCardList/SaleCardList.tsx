import { Card, Empty, Pagination, Skeleton } from 'antd';
import { PAGE_SIZE } from '../../data/sale.constants.ts';
import type { SaleResponse } from '../../types/index.ts';
import SaleCard from './SaleCard.tsx';

type SaleCardListProps = {
  data: SaleResponse[];
  page: number;
  pageSize?: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (sale: SaleResponse) => void;
};

const LOADING_SKELETON_COUNT = 4;

/** Mobile card list — presentational only, mirrors the table's loading/empty/pagination states. */
function SaleCardList({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  loading = false,
  onPageChange,
  onView,
}: SaleCardListProps) {
  if (loading) {
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

  if (data.length === 0) {
    return <Empty description="No sales found" className="py-8" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.map((sale) => (
          <SaleCard key={sale.id} sale={sale} onView={onView} />
        ))}
      </div>
      {total > 0 ? (
        <div className="mt-4 flex justify-center">
          <Pagination
            size="small"
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={false}
            onChange={onPageChange}
            showTotal={(entryTotal, range) =>
              `Showing ${range[0]} to ${range[1]} of ${entryTotal} entries`
            }
          />
        </div>
      ) : null}
    </div>
  );
}

export default SaleCardList;
