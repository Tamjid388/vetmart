import { useRef } from 'react';
import { App, Breadcrumb } from 'antd';
import { Link, useNavigate } from 'react-router';
import { SaleForm } from '../../components/SaleForm/index.ts';
import { useSaleMutations } from '../../hooks/useSaleMutations/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import type { CreateSalePayload } from '../../types/index.ts';

/** POS terminal: one idempotency key per checkout attempt. */
function CreateSalePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { createSale, isCreating, createError } = useSaleMutations();
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const handleSubmit = (payload: Omit<CreateSalePayload, 'idempotencyKey'>) => {
    createSale(
      { ...payload, idempotencyKey: idempotencyKeyRef.current },
      {
        // Key survives retries (cart intact) until success, then regenerates.
        onSuccess: (sale) => {
          idempotencyKeyRef.current = crypto.randomUUID();
          message.success(`Sale ${sale.invoiceNo} completed`);
          navigate(`/sales/${sale.id}/edit`);
        },
        onError: (error) => {
          message.error(getApiErrorMessage(error, 'Failed to complete sale'));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[{ title: <Link to="/sales">Sales</Link> }, { title: 'New Sale (POS)' }]}
      />
      <SaleForm onSubmit={handleSubmit} submitting={isCreating} serverError={createError} />
    </div>
  );
}

export default CreateSalePage;
