import { Card, Descriptions, Empty, Tag } from 'antd';
import type { PaymentMethod, PaymentResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';

const methodColor: Record<PaymentMethod, string> = {
  CASH: 'green',
  BKASH: 'pink',
  NAGAD: 'orange',
  CARD: 'blue',
};

type PaymentDetailsProps = {
  payment: PaymentResponse | null;
};

function PaymentDetails({ payment }: PaymentDetailsProps) {
  const isMobile = useIsMobile();
  if (!payment) {
    return (
      <Card>
        <Empty description="Payment not found" />
      </Card>
    );
  }

  return (
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" layout={isMobile ? 'vertical' : 'horizontal'}>
      <Descriptions.Item label="Customer">
        {payment.customer ? `${payment.customer.name} (${payment.customer.phone})` : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Method">
        <Tag color={methodColor[payment.method]}>{payment.method}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Amount">{formatTaka(payment.amount)}</Descriptions.Item>
      <Descriptions.Item label="Collected">{formatDateTime(payment.paidAt)}</Descriptions.Item>
      <Descriptions.Item label="Linked Sale">
        {payment.sale ? `#${payment.sale.invoiceNo}` : '— (against running due)'}
      </Descriptions.Item>
      <Descriptions.Item label="Collected By">
        {payment.collectedByUser?.name ?? payment.collectedByUser?.email ?? '—'}
      </Descriptions.Item>
    </Descriptions>
  );
}

export default PaymentDetails;
