import { Tag } from 'antd';
import type { ExpiryStatus } from '../../types/index.ts';

const expiryColors: Record<Exclude<ExpiryStatus, 'Active'>, string> = {
  'Near Expiry': 'orange',
  Expired: 'volcano',
};

type ExpiryBadgeProps = {
  status: Exclude<ExpiryStatus, 'Active'>;
};

function ExpiryBadge({ status }: ExpiryBadgeProps) {
  return <Tag color={expiryColors[status]}>{status}</Tag>;
}

export default ExpiryBadge;
