import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  FEED_UNITS,
  MEDICINE_FORMS,
  MEDICINE_UNITS,
  PRODUCT_TYPES,
} from '../../data/product.constants.ts';
import { productSchema } from '../../schemas/product.schema.ts';
import type {
  CreateProductPayload,
  ProductResponse,
  ProductType,
  UpdateProductPayload,
} from '../../types/index.ts';
import { useCategories, useCategoryMutations } from '../../../categories/hooks/index.ts';
import { useMe } from '../../../auth/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { getFirstBatchNumber, getEarliestExpiry, getTotalStock } from '../../utils/index.ts';

type ProductFormFields = {
  productType: ProductType;
  name: string;
  categoryId: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  vatPercent: number;
  description: string;
  batchNumber: string;
  expiryDate: Dayjs;
  stock: number;
  weightKg?: number;
  // MEDICINE specifics
  form?: string;
  genericName?: string;
  strength?: string;
  requiresPrescription?: boolean;
  // FEED specifics
  targetSpecies?: string;
  feedType?: string;
  proteinPct?: number;
  nominalPackKg?: number;
};

type ProductFormProps = {
  mode: 'create' | 'edit';
  initialValues?: ProductResponse;
  submitting?: boolean;
  onSubmit: (values: CreateProductPayload | UpdateProductPayload) => void;
  onCancel: () => void;
};

function toFormValues(product?: ProductResponse): Partial<ProductFormFields> {
  if (!product) {
    return { productType: 'MEDICINE', vatPercent: 0, minStock: 0, stock: 0 };
  }

  const expiry = getEarliestExpiry(product);

  return {
    productType: product.productType,
    name: product.name,
    categoryId: product.categoryId,
    unit: product.unit,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    minStock: product.minStock ?? 0,
    vatPercent: product.vatPercent ?? 0,
    description: product.description ?? '',
    batchNumber: getFirstBatchNumber(product),
    expiryDate: expiry ? dayjs(expiry) : undefined,
    stock: getTotalStock(product),
    form: product.medicineDetails?.form ?? undefined,
    genericName: product.medicineDetails?.genericName ?? undefined,
    strength: product.medicineDetails?.strength ?? undefined,
    requiresPrescription: product.medicineDetails?.requiresPrescription ?? undefined,
    targetSpecies: product.feedDetails?.targetSpecies ?? undefined,
    feedType: product.feedDetails?.feedType ?? undefined,
    proteinPct: product.feedDetails?.proteinPct ?? undefined,
    nominalPackKg: product.feedDetails?.nominalPackKg ?? undefined,
  };
}

function ProductForm({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [form] = Form.useForm<ProductFormFields>();
  const { message } = App.useApp();
  const { isAdmin } = useMe();
  const isEdit = mode === 'edit';
  const watchedType = Form.useWatch('productType', form) as ProductType | undefined;
  const activeType: ProductType =
    watchedType ?? initialValues?.productType ?? 'MEDICINE';
  const isMedicine = activeType === 'MEDICINE';
  const unitOptions = isMedicine ? MEDICINE_UNITS : FEED_UNITS;

  const { categories, isLoading: categoriesLoading } = useCategories(activeType, true);
  const { createCategoryAsync, isCreating: isCreatingCategory } = useCategoryMutations();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  const handleTypeChange = (value: ProductType) => {
    // Category belongs to one productType — clear stale selection.
    form.setFieldsValue({ categoryId: undefined as unknown as string, unit: undefined as unknown as string });
    void value;
  };

  const handleQuickAdd = async () => {
    const name = quickAddName.trim();
    if (!name) {
      message.error('Enter a category name');
      return;
    }
    try {
      const created = await createCategoryAsync({ productType: activeType, name });
      form.setFieldsValue({ categoryId: created.id });
      message.success(`Category "${created.name}" added`);
      setQuickAddOpen(false);
      setQuickAddName('');
    } catch (err) {
      const apiMessage = getApiErrorMessage(err, 'Failed to create category');
      const lower = apiMessage.toLowerCase();
      if (lower.includes('already exists')) {
        message.error('Category already exists for this product type');
      } else if (lower.includes('forbidden') || lower.includes('not allowed') || lower.includes('admin')) {
        message.error('Only admins can create categories — ask an admin to add it');
      } else {
        message.error(apiMessage);
      }
    }
  };

  const handleFinish = (values: ProductFormFields) => {
    const base = {
      name: values.name,
      categoryId: values.categoryId,
      unit: values.unit as CreateProductPayload['unit'],
      purchasePrice: values.purchasePrice,
      sellingPrice: values.sellingPrice,
      minStock: values.minStock,
      vatPercent: values.vatPercent,
      description: values.description,
    };

    if (isEdit) {
      const payload: UpdateProductPayload = {
        ...base,
        ...(isMedicine
          ? {
              medicineDetails: {
                ...(values.form ? { form: values.form as NonNullable<CreateProductPayload['medicineDetails']>['form'] } : {}),
                ...(values.genericName?.trim() ? { genericName: values.genericName.trim() } : {}),
                ...(values.strength?.trim() ? { strength: values.strength.trim() } : {}),
                ...(values.requiresPrescription !== undefined
                  ? { requiresPrescription: values.requiresPrescription }
                  : {}),
              },
            }
          : {
              feedDetails: {
                ...(values.targetSpecies?.trim() ? { targetSpecies: values.targetSpecies.trim() } : {}),
                ...(values.feedType?.trim() ? { feedType: values.feedType.trim() } : {}),
                ...(values.proteinPct !== undefined ? { proteinPct: values.proteinPct } : {}),
                ...(values.nominalPackKg !== undefined ? { nominalPackKg: values.nominalPackKg } : {}),
              },
            }),
      };
      onSubmit(payload);
      return;
    }

    const payload: CreateProductPayload = {
      productType: values.productType,
      ...base,
      ...(isMedicine
        ? {
            medicineDetails: {
              ...(values.form ? { form: values.form as NonNullable<CreateProductPayload['medicineDetails']>['form'] } : {}),
              ...(values.genericName?.trim() ? { genericName: values.genericName.trim() } : {}),
              ...(values.strength?.trim() ? { strength: values.strength.trim() } : {}),
              ...(values.requiresPrescription !== undefined
                ? { requiresPrescription: values.requiresPrescription }
                : {}),
            },
          }
        : {
            feedDetails: {
              ...(values.targetSpecies?.trim() ? { targetSpecies: values.targetSpecies.trim() } : {}),
              ...(values.feedType?.trim() ? { feedType: values.feedType.trim() } : {}),
              ...(values.proteinPct !== undefined ? { proteinPct: values.proteinPct } : {}),
              ...(values.nominalPackKg !== undefined ? { nominalPackKg: values.nominalPackKg } : {}),
            },
          }),
      initialBatch: {
        batchNumber: values.batchNumber || undefined,
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
        stock: values.stock,
        ...(values.weightKg !== undefined ? { weightKg: values.weightKg } : {}),
      },
    };
    onSubmit(payload);
  };

  return (
    <Card>
      <Typography.Title level={4} className="!mb-6">
        {isMedicine ? 'Medicine Specifications & Stock Setup' : 'Feed Specifications & Stock Setup'}
      </Typography.Title>

      <Form<ProductFormFields>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={toFormValues(initialValues)}
        onFinish={handleFinish}
      >
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item label="Product Type" name="productType" rules={productSchema.productType}>
                <Select
                  placeholder="Select type"
                  disabled={isEdit}
                  onChange={handleTypeChange}
                  options={PRODUCT_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </Form.Item>
              <Form.Item label="Product Name" name="name" rules={productSchema.name}>
                <Input placeholder={isMedicine ? 'e.g. Napa Extend 665mg' : 'e.g. ACI Layer 25kg'} />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item
                label="Category"
                name="categoryId"
                rules={productSchema.categoryId}
                extra={
                  isAdmin ? (
                    <Button
                      type="link"
                      size="small"
                      className="!px-0"
                      onClick={() => setQuickAddOpen(true)}
                    >
                      + New {activeType === 'MEDICINE' ? 'medicine' : 'feed'} category
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Missing a category? Ask an admin to add it.
                    </span>
                  )
                }
              >
                <Select
                  placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'}
                  loading={categoriesLoading}
                  showSearch
                  optionFilterProp="label"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  notFoundContent={
                    categoriesLoading
                      ? 'Loading...'
                      : isAdmin
                        ? 'No categories yet — click + New below to add one'
                        : 'No categories yet — ask an admin to add one'
                  }
                />
              </Form.Item>
              <Form.Item label="Unit" name="unit" rules={productSchema.unit}>
                <Select
                  placeholder="Select unit"
                  options={unitOptions.map((unit) => ({
                    value: unit,
                    label: unit,
                  }))}
                />
              </Form.Item>
            </div>

            {isMedicine ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item label="Form" name="form">
                  <Select
                    allowClear
                    placeholder="Select form"
                    options={MEDICINE_FORMS.map((f) => ({ value: f, label: f }))}
                  />
                </Form.Item>
                <Form.Item label="Generic Name" name="genericName">
                  <Input placeholder="e.g. Paracetamol" />
                </Form.Item>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item label="Target Species" name="targetSpecies">
                  <Input placeholder="e.g. Poultry, Cattle, Fish" />
                </Form.Item>
                <Form.Item label="Feed Type" name="feedType">
                  <Input placeholder="e.g. Layer, Broiler, Dairy" />
                </Form.Item>
              </div>
            )}

            {isMedicine ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item label="Strength" name="strength">
                  <Input placeholder="e.g. 500mg" />
                </Form.Item>
                <Form.Item label="Prescription" name="requiresPrescription" valuePropName="checked">
                  <Checkbox>Requires prescription</Checkbox>
                </Form.Item>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Form.Item label="Protein %" name="proteinPct">
                  <InputNumber className="w-full" min={0} max={100} step={0.1} placeholder="18.5" />
                </Form.Item>
                <Form.Item label="Pack Size (kg)" name="nominalPackKg">
                  <InputNumber className="w-full" min={0} step={1} placeholder="25" />
                </Form.Item>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item
                label="Purchase Price (৳)"
                name="purchasePrice"
                rules={productSchema.purchasePrice}
              >
                <InputNumber className="w-full" min={0} step={0.01} placeholder="12.50" />
              </Form.Item>
              <Form.Item
                label="Selling Price (৳)"
                name="sellingPrice"
                rules={productSchema.sellingPrice}
              >
                <InputNumber className="w-full" min={0} step={0.01} placeholder="15.00" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Form.Item
                label="Minimum Stock Warning Level"
                name="minStock"
                rules={productSchema.minStock}
              >
                <InputNumber className="w-full" min={0} placeholder="100" />
              </Form.Item>
              <Form.Item
                label="VAT Percentage (%)"
                name="vatPercent"
                rules={productSchema.vatPercent}
              >
                <InputNumber className="w-full" min={0} max={100} placeholder="5" />
              </Form.Item>
            </div>

            <Form.Item label="Product Description / Composition" name="description">
              <Input.TextArea
                rows={5}
                placeholder="Write down indications, contraindications, active salt ingredients..."
              />
            </Form.Item>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Typography.Title level={5} className="!mb-4">
                Batch & Expiry Information
              </Typography.Title>

              <Form.Item
                label={isEdit ? 'Batch Number' : 'Initial Batch Number'}
                name="batchNumber"
                rules={isMedicine ? productSchema.batchNumberMedicine : undefined}
              >
                <Input placeholder="e.g. B-NAPA-2024" />
              </Form.Item>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                rules={isMedicine ? productSchema.expiryDate : productSchema.expiryDateFeed}
              >
                <DatePicker className="w-full" format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                label={isEdit ? 'Stock Quantity' : 'Initial Stock Quantity'}
                name="stock"
                rules={productSchema.stock}
              >
                <InputNumber className="w-full" min={0} placeholder="500" />
              </Form.Item>
              {!isMedicine && (
                <Form.Item label="Lot Weight (kg)" name="weightKg">
                  <InputNumber className="w-full" min={0} step={0.1} placeholder="e.g. 24.8" />
                </Form.Item>
              )}
            </div>

            <Alert
              type="info"
              showIcon
              message="Setting a Minimum Stock warn level prompts the low-stock status badge triggers on your Sales dashboard automatically."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save Product
          </Button>
        </div>
      </Form>

      {isAdmin && (
        <Modal
          title={`New ${activeType === 'MEDICINE' ? 'medicine' : 'feed'} category`}
          open={quickAddOpen}
          onOk={handleQuickAdd}
          confirmLoading={isCreatingCategory}
          onCancel={() => {
            setQuickAddOpen(false);
            setQuickAddName('');
          }}
          okText="Add Category"
        >
          <Input
            placeholder="e.g. Antibiotics"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            onPressEnter={handleQuickAdd}
            maxLength={100}
          />
        </Modal>
      )}
    </Card>
  );
}

export default ProductForm;
