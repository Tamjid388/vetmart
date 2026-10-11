import { z } from 'zod';

const nameField = z.string().trim().min(1, 'Customer name is required').max(255);
const phoneField = z.string().trim().min(1, 'Phone number is required').max(50);
const addressField = z.string().trim().max(1000).optional();
const areaField = z.string().trim().max(255).optional();
const categoryField = z.string().trim().max(100).optional();

const create = z.object({
  body: z
    .object({
      name: nameField,
      phone: phoneField,
      address: addressField,
      area: areaField,
      category: categoryField,
      isActive: z.boolean().optional(),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      name: nameField.optional(),
      phone: phoneField.optional(),
      address: addressField,
      area: areaField,
      category: categoryField,
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const CustomerValidation = {
  create,
  update,
};
