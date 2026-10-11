import { App, Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { CustomerForm } from '../../components/CustomerForm/index.ts';
import { useCustomer } from '../../hooks/useCustomer/index.ts';
import { useCustomerMutations } from '../../hooks/useCustomerMutations/index.ts';
import { getCustomerSubmitErrorMessage } from '../../schemas/customer.schema.ts';
import type { CustomerFormValues } from '../../types/index.ts';

function EditCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: customer, isLoading } = useCustomer(id);
  const { updateCustomer, isUpdating } = useCustomerMutations();

  const handleSubmit = (values: CustomerFormValues) => {
    if (!id) return;
    updateCustomer(
      {
        id,
        payload: {
          name: values.name,
          phone: values.phone,
          address: values.address,
          area: values.area,
          category: values.category,
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => {
          message.success('Customer updated');
          navigate('/customers');
        },
        onError: (error) => {
          message.error(getCustomerSubmitErrorMessage(error, 'update'));
        },
      },
    );
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
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/customers">Customers</Link> },
          { title: 'Edit Customer' },
        ]}
      />
      <CustomerForm
        key={customer.id}
        mode="edit"
        initialValues={customer}
        submitting={isUpdating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/customers')}
      />
    </div>
  );
}

export default EditCustomerPage;
