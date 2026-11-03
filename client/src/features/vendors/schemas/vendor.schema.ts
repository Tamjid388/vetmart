import axios from 'axios';
import { getApiErrorMessage } from '../../../lib/axios/axios.ts';

export function isPhoneConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

/** Maps server errors to form-friendly messages (409 = duplicate phone). */
export function getVendorSubmitErrorMessage(
  error: unknown,
  action: 'create' | 'update' = 'create',
): string {
  if (isPhoneConflictError(error)) {
    return 'This phone number is already registered to another vendor.';
  }
  return getApiErrorMessage(
    error,
    action === 'create' ? 'Failed to create vendor' : 'Failed to update vendor',
  );
}

export const vendorSchema = {
  companyName: [{ required: true, message: 'Company name is required' }],
  phone: [{ required: true, message: 'Phone number is required' }],
};
