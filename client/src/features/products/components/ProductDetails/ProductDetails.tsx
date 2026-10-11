import { Descriptions, List } from 'antd';
import type { ProductResponse } from '../../types/index.ts';
import { NEAR_EXPIRY_DAYS } from '../../data/product.constants.ts';
import { formatExpiryDate, formatTaka } from '../../utils/format.ts';
import {
  getCategoryName,
  getMinStock,
  getTotalStock,
} from '../../utils/index.ts';
import { getProductStatus } from '../../utils/productStatus.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import ExpiryBadge from '../ExpiryBadge/ExpiryBadge.tsx';
import StockBadge from '../StockBadge/StockBadge.tsx';

type ProductDetailsProps = {
  product: ProductResponse;
  /** Cost (purchase price) is admin-only. */
  showCost?: boolean;
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Same window as the product-level status: expired or within near-expiry days. */
function isBatchExpiryAlert(expiryDate: Date | string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const diffDays = Math.round((startOfDay(expiry).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);
  return diffDays <= NEAR_EXPIRY_DAYS;
}

function ProductDetails({ product, showCost = false }: ProductDetailsProps) {
  const status = getProductStatus(product);
  const isMobile = useIsMobile();
  // Earliest-expiry-first matches the FIFO order sales consume lots in.
  const batches = [...(product.batches ?? [])].sort((a, b) => {
    const aTime = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  return (
    <Descriptions bordered size="small" column={1} layout={isMobile ? 'vertical' : 'horizontal'}>
      <Descriptions.Item label="Product Name">{product.name}</Descriptions.Item>
      <Descriptions.Item label="Category">{getCategoryName(product)}</Descriptions.Item>
      <Descriptions.Item label="Unit">{product.unit}</Descriptions.Item>
      {showCost && (
        <Descriptions.Item label="Purchase Price">{formatTaka(product.purchasePrice)}</Descriptions.Item>
      )}
      <Descriptions.Item label="Selling Price">{formatTaka(product.sellingPrice)}</Descriptions.Item>
      <Descriptions.Item label="VAT">{product.vatPercent}%</Descriptions.Item>
      <Descriptions.Item label="Stock">{getTotalStock(product)}</Descriptions.Item>
      <Descriptions.Item label="Min Stock">{getMinStock(product)}</Descriptions.Item>
      <Descriptions.Item label={`Batches (${batches.length})`}>
        {batches.length === 0 ? (
          '—'
        ) : (
          <List
            size="small"
            dataSource={batches}
            renderItem={(batch) => {
              const alert = isBatchExpiryAlert(batch.expiryDate);
              return (
                <List.Item className="!px-0">
                  <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium text-slate-800">
                      {batch.batchNumber || '—'}
                    </span>
                    <span className={alert ? 'font-medium text-red-600' : 'text-slate-600'}>
                      {formatExpiryDate(batch.expiryDate)}
                    </span>
                    {showCost ? (
                      <span className="text-xs text-slate-500">
                        ক্রয় {formatTaka(batch.purchasePrice)}
                      </span>
                    ) : null}
                    <span className="ml-auto font-semibold text-slate-800">
                      {batch.stock} টি
                    </span>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        {status === 'Expired' || status === 'Near Expiry' ? (
          <ExpiryBadge status={status} />
        ) : (
          <StockBadge status={status} />
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Description">{product.description || '—'}</Descriptions.Item>
    </Descriptions>
  );
}

export default ProductDetails;
