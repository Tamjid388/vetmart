import { useRef } from 'react';
import { App, Breadcrumb } from 'antd';
import { Link, useNavigate } from 'react-router';
import { PurchaseForm } from '../../components/PurchaseForm/index.ts';
import { usePurchaseMutations } from '../../hooks/usePurchaseMutations/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import type { CreatePurchasePayload } from '../../types/index.ts';

/** GRN entry: one idempotency key per receipt attempt. */
function CreatePurchasePage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { createPurchase, isCreating, createError } = usePurchaseMutations();
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const handleSubmit = (payload: Omit<CreatePurchasePayload, 'idempotencyKey'>) => {
    createPurchase(
      { ...payload, idempotencyKey: idempotencyKeyRef.current },
      {
        // Key survives retries (lines intact) until success, then regenerates.
        onSuccess: (purchase) => {
          idempotencyKeyRef.current = crypto.randomUUID();
          message.success(`Purchase ${purchase.invoiceNo} recorded`);
          navigate(`/purchases/${purchase.id}/edit`);
        },
        onError: (error) => {
          message.error(getApiErrorMessage(error, 'Failed to record purchase'));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[{ title: <Link to="/purchases">Purchases</Link> }, { title: 'New Purchase (GRN)' }]}
      />
      <PurchaseForm onSubmit={handleSubmit} submitting={isCreating} serverError={createError} />
    </div>
  );
}

export default CreatePurchasePage;
