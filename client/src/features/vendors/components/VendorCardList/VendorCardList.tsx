import { Card, Empty, Pagination, Skeleton } from 'antd';
import { PAGE_SIZE } from '../../data/vendor.constants.ts';
import type { Vendor } from '../../types/index.ts';
import VendorCard from './VendorCard.tsx';

type VendorCardListProps = {
  data: Vendor[];
  page: number;
  pageSize?: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

const LOADING_SKELETON_COUNT = 4;

/** Mobile card list — presentational only, mirrors the table's loading/empty/pagination states. */
function VendorCardList({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  loading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: VendorCardListProps) {
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
    return <Empty description="No suppliers found" className="py-8" />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
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

export default VendorCardList;
