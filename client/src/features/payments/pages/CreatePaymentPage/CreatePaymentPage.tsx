import { App, Breadcrumb } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { PaymentForm } from '../../components/PaymentForm/index.ts';
import { usePaymentMutations } from '../../hooks/usePaymentMutations/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import type { CreatePaymentPayload } from '../../types/index.ts';

/** Due collection: optional ?customerId= prefill (Record Payment entry points). */
function CreatePaymentPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId');
  const { createPayment, isCreating, createError } = usePaymentMutations();

  const handleSubmit = (payload: CreatePaymentPayload) => {
    createPayment(payload, {
      onSuccess: (payment) => {
        message.success(`Payment of ${payment.amount} recorded`);
        navigate('/payments');
      },
      onError: (error) => {
        message.error(getApiErrorMessage(error, 'Failed to record payment'));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[{ title: <Link to="/payments">Payments</Link> }, { title: 'Record Payment' }]}
      />
      <PaymentForm
        initialCustomerId={initialCustomerId}
        submitting={isCreating}
        serverError={createError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/payments')}
      />
    </div>
  );
}

export default CreatePaymentPage;
