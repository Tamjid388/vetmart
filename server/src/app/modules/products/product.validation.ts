import { z } from 'zod';

const productTypeEnum = z.enum(['MEDICINE', 'FEED']);
const productUnitEnum = z.enum([
  'PIECE',
  'STRIP',
  'BOTTLE',
  'BOX',
  'VIAL',
  'AMPOULE',
  'TUBE',
  'SACHET',
  'BAG',
  'KG',
  'LITER',
  'OTHER',
]);
const medicineFormEnum = z.enum([
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'CREAM',
  'OINTMENT',
  'POWDER',
  'DROPS',
  'SUSPENSION',
  'SOLUTION',
  'OTHER',
]);

const medicineDetailsSchema = z
  .object({
    form: medicineFormEnum.optional(),
    genericName: z.string().trim().max(255).optional(),
    strength: z.string().trim().max(100).optional(),
    requiresPrescription: z.boolean().optional(),
  })
  .strict();

const feedDetailsSchema = z
  .object({
    targetSpecies: z.string().trim().max(100).optional(),
    feedType: z.string().trim().max(100).optional(),
    proteinPct: z.number().min(0).max(100).optional(),
    nominalPackKg: z.number().positive().optional(),
  })
  .strict();

const initialBatchSchema = z
  .object({
    batchNumber: z.string().trim().max(100).optional(),
    expiryDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    stock: z.number().int().default(0),
    purchasePrice: z.number().positive().optional(),
    weightKg: z.number().positive().optional(),
  })
  .strict();

const baseFields = {
  name: z.string().trim().min(1, 'Product name is required').max(255),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().min(1, 'categoryId is required'),
  unit: productUnitEnum,
  purchasePrice: z.number().positive('Purchase price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  minStock: z.number().int().min(0).default(0),
  vatPercent: z.number().min(0).max(100).default(0),
  manufacturer: z.string().trim().max(255).optional(),
  sku: z.string().trim().max(100).optional(),
  barcode: z.string().trim().max(100).optional(),
  imageUrl: z.string().trim().max(2000).optional(),
  isActive: z.boolean().default(true),
};

const create = z.object({
  body: z
    .object({
      productType: productTypeEnum,
      ...baseFields,
      medicineDetails: medicineDetailsSchema.optional(),
      feedDetails: feedDetailsSchema.optional(),
      initialBatch: initialBatchSchema.optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (data.productType === 'MEDICINE') {
        if (!data.initialBatch?.batchNumber) {
          ctx.addIssue({
            code: 'custom',
            path: ['initialBatch', 'batchNumber'],
            message: 'batchNumber is required for MEDICINE lots',
          });
        }
        if (data.feedDetails !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['feedDetails'],
            message: 'feedDetails is only allowed when productType is FEED',
          });
        }
      }
      if (data.productType === 'FEED') {
        if (!data.initialBatch?.expiryDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['initialBatch', 'expiryDate'],
            message: 'expiryDate is required for FEED lots (feed expiry mandatory)',
          });
        }
        if (data.medicineDetails !== undefined) {
          ctx.addIssue({
            code: 'custom',
            path: ['medicineDetails'],
            message: 'medicineDetails is only allowed when productType is MEDICINE',
          });
        }
      }
    }),
});

const update = z.object({
  body: z
    .object({
      name: baseFields.name.optional(),
      description: baseFields.description,
      categoryId: baseFields.categoryId.optional(),
      unit: productUnitEnum.optional(),
      purchasePrice: z.number().positive().optional(),
      sellingPrice: z.number().positive().optional(),
      minStock: z.number().int().min(0).optional(),
      vatPercent: z.number().min(0).max(100).optional(),
      manufacturer: baseFields.manufacturer,
      sku: baseFields.sku,
      barcode: baseFields.barcode,
      imageUrl: baseFields.imageUrl,
      isActive: z.boolean().optional(),
      medicineDetails: medicineDetailsSchema.optional(),
      feedDetails: feedDetailsSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const ProductValidation = {
  create,
  update,
};
