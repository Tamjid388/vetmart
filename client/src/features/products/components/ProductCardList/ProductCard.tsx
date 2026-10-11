import { Button, Card, Space } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { ProductResponse } from '../../types/index.ts';
import {
  formatExpiryDate,
  formatTaka,
  getCategoryName,
  getEarliestExpiry,
  getExpiryStatus,
  getFirstBatchNumber,
  getProductStatus,
  getTotalStock,
} from '../../utils/index.ts';
import ExpiryBadge from '../ExpiryBadge/ExpiryBadge.tsx';
import StockBadge from '../StockBadge/StockBadge.tsx';

type ProductCardProps = {
  product: ProductResponse;
  onView: (product: ProductResponse) => void;
  onEdit: (product: ProductResponse) => void;
  onDelete: (product: ProductResponse) => void;
  /** Cost (purchase price) is admin-only. Staff sees qty/selling only. */
  showCost?: boolean;
};

/** Same badge rule as the desktop table's status cell — colors not restyled. */
function ProductStatusCell({ product }: { product: ProductResponse }) {
  const status = getProductStatus(product);
  if (status === 'Expired' || status === 'Near Expiry') {
    return <ExpiryBadge status={status} />;
  }
  return <StockBadge status={status} />;
}

/**
 * E8b mobile card per `stockpage.png` — presentational only, no data fetching.
 * Meta sources mirror the desktop table (first lot batch no., earliest expiry,
 * summed stock); actions use the same callbacks as the table row.
 */
function ProductCard({ product, onView, onEdit, onDelete, showCost = false }: ProductCardProps) {
  const expiryStatus = getExpiryStatus(product);
  const isExpiryAlert = expiryStatus === 'Expired' || expiryStatus === 'Near Expiry';
  const batchNumber = getFirstBatchNumber(product);

  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">{product.name}</div>
          <div className="truncate text-xs text-slate-500">{product.manufacturer || '—'}</div>
        </div>
        <div className="shrink-0">
          <ProductStatusCell product={product} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">ক্যাটাগরি</div>
          <div className="truncate text-slate-800">{getCategoryName(product) || '—'}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">ব্যাচ নং</div>
          <div className="truncate text-slate-800">{batchNumber || '—'}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">মেয়াদ (Expiry)</div>
          <div className={isExpiryAlert ? 'font-medium text-red-600' : 'text-slate-800'}>
            {formatExpiryDate(getEarliestExpiry(product))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">পরিমাণ (Stock)</div>
          <div className="font-semibold text-slate-800">{getTotalStock(product)} টি</div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <div className="min-w-0 text-[13px]">
          <span className="font-semibold text-[#16A34A]">{formatTaka(product.sellingPrice)}</span>
          {showCost ? (
            <span className="ml-2 text-xs text-slate-500">
              ক্রয় {formatTaka(product.purchasePrice)}
            </span>
          ) : null}
        </div>
        <Space size={8}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${product.name}`}
            onClick={() => onView(product)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${product.name}`}
            onClick={() => onEdit(product)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${product.name}`}
            onClick={() => onDelete(product)}
          />
        </Space>
      </div>
    </Card>
  );
}

export default ProductCard;
