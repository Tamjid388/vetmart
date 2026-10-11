import { App, Avatar, Breadcrumb, Button, Card, Divider, Empty, Spin, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router';
import { CustomerDetails } from '../../components/CustomerDetails/index.ts';
import { CustomerHistory } from '../../components/CustomerHistory/index.ts';
import { useCustomer } from '../../hooks/useCustomer/index.ts';
import { useCustomerMutations } from '../../hooks/useCustomerMutations/index.ts';
import { getCustomerSubmitErrorMessage } from '../../schemas/customer.schema.ts';
import { formatCustomerId, formatTaka, getInitials } from '../../utils/format.ts';

function ViewCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { data: customer, isLoading } = useCustomer(id);
  const { deleteCustomer, isDeleting } = useCustomerMutations();

  const handleDelete = () => {
    if (!customer) return;
    modal.confirm({
      title: 'Delete customer',
      content: `Delete “${customer.name}”? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteCustomer(customer.id, {
          onSuccess: () => {
            message.success('Customer deleted');
            navigate('/customers');
          },
          onError: (error) => {
            message.error(getCustomerSubmitErrorMessage(error, 'update'));
          },
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <Empty description="Customer not found">
          <Button type="primary" onClick={() => navigate('/customers')}>
            Back to customers
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <Breadcrumb
        className="[&>ol]:flex-wrap"
        items={[
          { title: <Link to="/customers">Customers</Link> },
          {
            title: (
              <span className="inline-block max-w-[45vw] truncate align-bottom md:max-w-none">
                {customer.name}
              </span>
            ),
          },
        ]}
      />
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar size={64} className="shrink-0 !bg-green-600 !text-xl">
              {getInitials(customer.name)}
            </Avatar>
            <div className="min-w-0">
              <Typography.Title level={3} className="!mb-0 truncate">
                {customer.name}
              </Typography.Title>
              <div className="mt-0.5 text-sm text-slate-500">
                {formatCustomerId(customer.id)} · {customer.phone}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color={customer.isActive ? 'success' : 'default'}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {customer.category && <Tag color="blue">{customer.category}</Tag>}
                {customer.dueBalance > 0 && (
                  <Tag color="error">Due {formatTaka(customer.dueBalance)}</Tag>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {customer.dueBalance > 0 && (
              <Button
                type="primary"
                onClick={() => navigate(`/payments/new?customerId=${customer.id}`)}
              >
                Record Payment
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/customers/${customer.id}/edit`)}
            >
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <Divider className="!my-5" />

        <CustomerDetails customer={customer} />
      </Card>

      <CustomerHistory customerId={customer.id} />
    </div>
  );
}

export default ViewCustomerPage;
