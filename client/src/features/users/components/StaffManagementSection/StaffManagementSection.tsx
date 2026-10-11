import { useState } from 'react';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMe } from '../../../auth/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useUserMutations } from '../../hooks/useUserMutations/index.ts';
import { useUsers } from '../../hooks/useUsers/index.ts';
import { getUserSubmitErrorMessage, userSchema } from '../../schemas/index.ts';
import type { ManagedUser, UserFormValues } from '../../types/index.ts';

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { label: 'Staff', value: 'staff' },
  { label: 'Admin', value: 'admin' },
] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' });
}

function StaffManagementSection() {
  const { message, modal } = App.useApp();
  const { user: currentUser } = useMe();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [createForm] = Form.useForm<UserFormValues>();
  const [editForm] = Form.useForm<{ name?: string; role?: string; password?: string }>();

  const { data, total, isLoading } = useUsers({
    searchTerm: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const { createUserAsync, updateUserAsync, deleteUser, isCreating, isUpdating } =
    useUserMutations();

  const rows = roleFilter ? data.filter((u) => u.role === roleFilter) : data;

  const handleCreate = async (values: UserFormValues) => {
    try {
      await createUserAsync({
        email: values.email.trim(),
        password: values.password,
        ...(values.name?.trim() ? { name: values.name.trim() } : {}),
        role: values.role,
      });
      message.success('User created');
      createForm.resetFields();
      setCreateOpen(false);
      setPage(1);
    } catch (error) {
      message.error(getUserSubmitErrorMessage(error, 'create'));
    }
  };

  const handleEdit = async (values: { name?: string; role?: string; password?: string }) => {
    if (!editing) return;
    try {
      await updateUserAsync({
        id: editing.id,
        payload: {
          ...(values.name?.trim() ? { name: values.name.trim() } : {}),
          ...(values.role ? { role: values.role as ManagedUser['role'] } : {}),
          ...(values.password ? { password: values.password } : {}),
        },
      });
      message.success('User updated');
      setEditing(null);
      editForm.resetFields();
    } catch (error) {
      message.error(getUserSubmitErrorMessage(error, 'update'));
    }
  };

  const handleDeactivate = (target: ManagedUser) => {
    modal.confirm({
      title: 'Deactivate user',
      content: `Deactivate “${target.email}”? They will no longer be able to sign in.`,
      okText: 'Deactivate',
      okType: 'danger',
      onOk: () => {
        deleteUser(target.id, {
          onSuccess: () => message.success('User deactivated'),
          onError: (error) => message.error(getApiErrorMessage(error, 'Failed to deactivate user')),
        });
      },
    });
  };

  const openEdit = (target: ManagedUser) => {
    setEditing(target);
    editForm.setFieldsValue({ name: target.name ?? undefined, role: target.role });
  };

  const columns: ColumnsType<ManagedUser> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name ?? '—',
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id;
        return (
          <Space>
            <Button size="small" onClick={() => openEdit(record)}>
              Edit
            </Button>
            <Button
              size="small"
              danger
              disabled={isSelf}
              title={isSelf ? 'You cannot deactivate your own account' : undefined}
              onClick={() => handleDeactivate(record)}
            >
              Deactivate
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title="Staff Management"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      }
    >
      <Typography.Paragraph type="secondary">
        Admins create staff and admin accounts here. New users sign in with their email and
        password — there is no public signup page.
      </Typography.Paragraph>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <Input.Search
          placeholder="Search by email or name"
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="lg:max-w-sm"
        />
        <Select
          placeholder="All roles"
          allowClear
          value={roleFilter}
          onChange={(value) => setRoleFilter(value)}
          options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          className="lg:w-40"
        />
      </div>

      <Table<ManagedUser>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          onChange: setPage,
          showTotal: (t) => `${t} users`,
        }}
      />

      <Modal
        title="Add User"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form<UserFormValues>
          form={createForm}
          layout="vertical"
          initialValues={{ role: 'staff' }}
          onFinish={handleCreate}
          preserve={false}
        >
          <Form.Item label="Email" name="email" rules={userSchema.email}>
            <Input placeholder="staff@shop.com" />
          </Form.Item>
          <Form.Item label="Name" name="name" rules={userSchema.name}>
            <Input placeholder="Full name (optional)" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={userSchema.password}>
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))} />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={isCreating}>
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Edit ${editing?.email ?? ''}`}
        open={!!editing}
        onCancel={() => {
          setEditing(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEdit}
          preserve={false}
        >
          <Form.Item label="Name" name="name" rules={userSchema.name}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            label="Role"
            name="role"
            tooltip={
              editing?.id === currentUser?.id ? 'You cannot change your own role' : undefined
            }
          >
            <Select
              disabled={editing?.id === currentUser?.id}
              options={ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </Form.Item>
          <Form.Item
            label="New password"
            name="password"
            rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password placeholder="Leave blank to keep current" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={isUpdating}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default StaffManagementSection;
