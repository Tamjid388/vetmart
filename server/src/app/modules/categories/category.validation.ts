import { z } from 'zod';

const productTypeEnum = z.enum(['MEDICINE', 'FEED']);
const nameField = z.string().trim().min(1, 'Category name is required').max(100);

const create = z.object({
  body: z
    .object({
      productType: productTypeEnum,
      name: nameField,
      isActive: z.boolean().optional(),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      productType: productTypeEnum.optional(),
      name: nameField.optional(),
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const CategoryValidation = {
  create,
  update,
};
