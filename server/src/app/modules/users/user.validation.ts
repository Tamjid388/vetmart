import { z } from 'zod';

const register = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1).optional(),
  }),
});

const login = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshToken = z.object({
  body: z.object({}).strict().optional(),
});

const update = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      password: z.string().min(6).optional(),
      role: z.enum(['admin', 'staff']).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// Admin-created accounts (E7). Unlike `register`, role is selectable (staff default).
const createUser = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      name: z.string().min(1).optional(),
      role: z.enum(['admin', 'staff']).default('staff'),
    })
    .strict(),
});

export const UserValidation = {
  register,
  login,
  refreshToken,
  update,
  createUser,
};
