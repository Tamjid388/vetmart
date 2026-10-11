import { App, Breadcrumb } from 'antd';
import { Link, useNavigate } from 'react-router';
import { CustomerForm } from '../../components/CustomerForm/index.ts';
import { useCustomerMutations } from '../../hooks/useCustomerMutations/index.ts';
import { getCustomerSubmitErrorMessage } from '../../schemas/customer.schema.ts';
import type { CustomerFormValues } from '../../types/index.ts';

function CreateCustomerPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { createCustomer, isCreating } = useCustomerMutations();

  const handleSubmit = (values: CustomerFormValues) => {
    createCustomer(
      {
        name: values.name,
        phone: values.phone,
        ...(values.address ? { address: values.address } : {}),
        ...(values.area ? { area: values.area } : {}),
        ...(values.category ? { category: values.category } : {}),
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          message.success('Customer saved');
          navigate('/customers');
        },
        onError: (error) => {
          message.error(getCustomerSubmitErrorMessage(error, 'create'));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/customers">Customers</Link> },
          { title: 'Add Customer' },
        ]}
      />
      <CustomerForm
        mode="create"
        submitting={isCreating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/customers')}
      />
    </div>
  );
}

export default CreateCustomerPage;
