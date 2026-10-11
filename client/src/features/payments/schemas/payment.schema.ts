import axios from 'axios';
import { getApiErrorMessage } from '../../../lib/axios/axios.ts';

export function isOverCollectionError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 400;
}

/** Maps server errors to form-friendly messages (400 = over-collection). */
export function getPaymentSubmitErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 400) {
    return error.response.data?.message ?? 'Collection exceeds the outstanding due.';
  }
  return getApiErrorMessage(error, 'Failed to record payment');
}

export const paymentSchema = {
  customerId: [{ required: true, message: 'Select a customer first' }],
  supplierId: [{ required: true, message: 'Select a supplier first' }],
  amount: [{ required: true, message: 'Enter an amount greater than 0' }],
  method: [{ required: true, message: 'Select a payment method' }],
};
