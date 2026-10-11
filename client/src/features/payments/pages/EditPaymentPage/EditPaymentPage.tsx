import { Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { PaymentDetails } from '../../components/PaymentDetails/index.ts';
import { usePayment } from '../../hooks/usePayment/index.ts';

/**
 * View-only payment receipt. Due collections are immutable ledger entries —
 * this route intentionally renders the receipt instead of a form.
 */
function EditPaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: payment, isLoading } = usePayment(id);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card>
        <Empty description="Payment not found">
          <Button type="primary" onClick={() => navigate('/payments')}>
            Back to payments
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/payments">Payments</Link> },
          { title: 'Payment receipt' },
        ]}
      />
      <Card>
        <PaymentDetails payment={payment} />
      </Card>
    </div>
  );
}

export default EditPaymentPage;
