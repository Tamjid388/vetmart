import { z } from 'zod';

const companyNameField = z.string().trim().min(1, 'Company name is required').max(255);
const contactPersonField = z.string().trim().max(255).optional();
const phoneField = z.string().trim().min(1, 'Phone number is required').max(50);
const addressField = z.string().trim().max(1000).optional();
const tradeLicenseField = z.string().trim().max(100).optional();
const paymentTermsField = z.number().int().min(0).optional();

const create = z.object({
  body: z
    .object({
      companyName: companyNameField,
      contactPerson: contactPersonField,
      phone: phoneField,
      address: addressField,
      tradeLicense: tradeLicenseField,
      paymentTerms: paymentTermsField,
      isActive: z.boolean().optional(),
    })
    .strict(),
});

const update = z.object({
  body: z
    .object({
      companyName: companyNameField.optional(),
      contactPerson: contactPersonField,
      phone: phoneField.optional(),
      address: addressField,
      tradeLicense: tradeLicenseField,
      paymentTerms: paymentTermsField,
      isActive: z.boolean().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const SupplierValidation = {
  create,
  update,
};
