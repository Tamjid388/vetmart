import { useState } from 'react';
import { App, Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tag } from 'antd';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CategoryResponse,
} from '../../api/index.ts';
import type { ProductType } from '../../../products/types/index.ts';
import { CATEGORY_PRODUCT_TYPES } from '../../data/category.constants.ts';

type CategoryFormFields = {
  productType: ProductType;
  name: string;
  isActive?: boolean;
};

function CategoriesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [productTypeFilter, setProductTypeFilter] = useState<'ALL' | ProductType>('ALL');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<CategoryFormFields>();

  const { data, isPending, refetch } = useQuery({
    queryKey: ['categories', 'admin', productTypeFilter, search, showInactive],
    queryFn: () =>
      getCategories({
        ...(productTypeFilter === 'ALL' ? {} : { productType: productTypeFilter }),
        ...(showInactive ? {} : { isActive: true }),
        ...(search.trim() ? { searchTerm: search.trim() } : {}),
        limit: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      productType: productTypeFilter === 'ALL' ? 'MEDICINE' : productTypeFilter,
      name: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row: CategoryResponse) => {
    setEditing(row);
    form.setFieldsValue({
      productType: row.productType,
      name: row.name,
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editing) {
        await updateCategory(editing.id, {
          name: values.name.trim(),
          // productType locked once products use it (server also guards).
          ...((editing.productCount ?? 0) > 0 ? {} : { productType: values.productType }),
          isActive: values.isActive,
        });
        message.success('Category updated');
      } else {
        await createCategory({
          productType: values.productType,
          name: values.name.trim(),
          isActive: true,
        });
        message.success('Category created');
      }
      setModalOpen(false);
      invalidate();
    } catch (err) {
      // AntD form validation errors carry errorFields — never toast those.
      if ((err as { errorFields?: unknown })?.errorFields) return;
      const apiMessage = getApiErrorMessage(err, 'Save failed');
      if (apiMessage.toLowerCase().includes('already exists')) {
        message.error('Category already exists for this product type');
      } else {
        message.error(apiMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = (row: CategoryResponse) => {
    modal.confirm({
      title: 'Deactivate category',
      content: `"${row.name}" will be hidden from Add Product. Continue?`,
      okText: 'Deactivate',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCategory(row.id);
          message.success('Category deactivated');
          invalidate();
        } catch (err) {
          const apiMessage = getApiErrorMessage(err, 'Deactivate failed');
          if (apiMessage.toLowerCase().includes('still use it')) {
            message.error(apiMessage);
          } else if (apiMessage.toLowerCase().includes('not found')) {
            message.error('Category not found — it may already be gone');
          } else {
            message.error(apiMessage);
          }
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <Space wrap>
            <Select
              value={productTypeFilter}
              style={{ width: 160 }}
              onChange={(v) => setProductTypeFilter(v)}
              options={[
                { value: 'ALL', label: 'All types' },
                ...CATEGORY_PRODUCT_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
            <Input.Search
              allowClear
              placeholder="Search categories"
              style={{ width: 220 }}
              onSearch={(v) => setSearch(v)}
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Switch checked={showInactive} onChange={setShowInactive} size="small" />
              Show inactive
            </label>
          </Space>
          <div className="flex items-center gap-2 lg:ml-auto">
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Category
            </Button>
          </div>
        </div>

        <Table<CategoryResponse>
          rowKey="id"
          loading={isPending}
          dataSource={data?.data ?? []}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            {
              title: 'Type',
              dataIndex: 'productType',
              key: 'productType',
              render: (v: string) => (
                <Tag color={v === 'MEDICINE' ? 'blue' : 'green'}>{v}</Tag>
              ),
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              key: 'isActive',
              render: (v: boolean) =>
                v ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>,
            },
            {
              title: 'Products',
              dataIndex: 'productCount',
              key: 'productCount',
              render: (v?: number) => v ?? '—',
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, row) => (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </Button>
                  {row.isActive && (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeactivate(row)}
                    >
                      Deactivate
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {data?.data.length ?? 0}
            {data?.meta ? ` of ${data.meta.total}` : ''} categories
            {data?.meta && data.meta.total > (data?.data.length ?? 0)
              ? ' — refine search to see more'
              : ''}
          </span>
          <Button size="small" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </Card>

      <Modal
        title={editing ? 'Edit Category' : 'Add Category'}
        open={modalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Save Changes' : 'Add Category'}
      >
        <Form<CategoryFormFields> form={form} layout="vertical" requiredMark>
          <Form.Item
            label="Product Type"
            name="productType"
            rules={[{ required: true, message: 'Product type is required' }]}
            tooltip={
              editing && (editing.productCount ?? 0) > 0
                ? 'Locked while products use this category'
                : undefined
            }
          >
            <Select
              disabled={!!editing && (editing.productCount ?? 0) > 0}
              options={CATEGORY_PRODUCT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Category name is required' }]}
          >
            <Input placeholder="e.g. Antibiotics" maxLength={100} />
          </Form.Item>
          {editing && (
            <Form.Item label="Active" name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default CategoriesPage;
