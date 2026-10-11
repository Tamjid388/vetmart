import axios from 'axios';
import { getApiErrorMessage } from '../../../lib/axios/axios.ts';

export function isPhoneConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

/** Maps server errors to form-friendly messages (409 = duplicate phone). */
export function getCustomerSubmitErrorMessage(
  error: unknown,
  action: 'create' | 'update' = 'create',
): string {
  if (isPhoneConflictError(error)) {
    return 'This phone number is already registered to another customer.';
  }
  return getApiErrorMessage(
    error,
    action === 'create' ? 'Failed to create customer' : 'Failed to update customer',
  );
}

export const customerSchema = {
  name: [{ required: true, message: 'Customer name is required' }],
  phone: [{ required: true, message: 'Phone number is required' }],
};
