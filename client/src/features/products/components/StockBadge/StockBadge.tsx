import { Tag } from 'antd';
import type { StockStatus } from '../../types/index.ts';

const stockColors: Record<StockStatus, string> = {
  'In Stock': 'success',
  'Low Stock': 'gold',
  Critical: 'error',
};

type StockBadgeProps = {
  status: StockStatus;
};

function StockBadge({ status }: StockBadgeProps) {
  return <Tag color={stockColors[status]}>{status}</Tag>;
}

export default StockBadge;
