import axios from 'axios';
import { getApiErrorMessage } from '../../../lib/axios/axios.ts';

export function isEmailConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function isSelfGuardError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 400;
}

/** Maps server errors to form-friendly messages (409 = duplicate email, 400 = self-guard). */
export function getUserSubmitErrorMessage(
  error: unknown,
  action: 'create' | 'update' = 'create',
): string {
  if (isEmailConflictError(error)) {
    return 'This email is already registered to another user.';
  }
  if (isSelfGuardError(error)) {
    return getApiErrorMessage(error, 'You cannot change your own account this way.');
  }
  return getApiErrorMessage(
    error,
    action === 'create' ? 'Failed to create user' : 'Failed to update user',
  );
}

export const userSchema = {
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email' as const, message: 'Enter a valid email address' },
  ],
  password: [
    { required: true, message: 'Password is required' },
    { min: 6, message: 'Password must be at least 6 characters' },
  ],
  name: [{ min: 1, message: 'Name cannot be empty' }],
};
