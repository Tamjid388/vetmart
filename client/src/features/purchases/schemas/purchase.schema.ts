import { getApiErrorMessage } from '../../../lib/axios/axios.ts';

/** Maps server errors to GRN-friendly messages. */
export function getPurchaseSubmitErrorMessage(error: unknown): string {
  return getApiErrorMessage(error, 'Failed to record purchase');
}

export const purchaseSchema = {
  supplierId: [{ required: true, message: 'Select a supplier first' }],
};
