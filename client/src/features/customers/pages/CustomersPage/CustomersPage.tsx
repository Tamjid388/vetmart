import { useState } from 'react';
import { App, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { CustomerFilters } from '../../components/CustomerFilters/index.ts';
import { CustomerCardList } from '../../components/CustomerCardList/index.ts';
import { CustomerTable } from '../../components/CustomerTable/index.ts';
import { DEFAULT_CUSTOMER_FILTERS, PAGE_SIZE } from '../../data/customer.constants.ts';
import { useCustomerMutations } from '../../hooks/useCustomerMutations/index.ts';
import { useCustomers } from '../../hooks/useCustomers/index.ts';
import { getCustomerSubmitErrorMessage } from '../../schemas/customer.schema.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { Customer, CustomerListFilters } from '../../types/index.ts';

function CustomersPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { message, modal } = App.useApp();
  const { deleteCustomer } = useCustomerMutations();
  const [filters, setFilters] = useState<CustomerListFilters>(DEFAULT_CUSTOMER_FILTERS);
  const [page, setPage] = useState(1);
  const { data, total, isLoading } = useCustomers({
    searchTerm: filters.search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const handleFiltersChange = (next: CustomerListFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleDelete = (customer: Customer) => {
    modal.confirm({
      title: 'Delete customer',
      content: `Delete “${customer.name}”? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteCustomer(customer.id, {
          onSuccess: () => {
            message.success('Customer deleted');
          },
          onError: (error) => {
            message.error(getCustomerSubmitErrorMessage(error, 'update'));
          },
        });
      },
    });
  };

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => navigate('/customers/new')}
        >
          Add Customer
        </Button>
        <CustomerFilters value={filters} onChange={handleFiltersChange} />
        <CustomerCardList
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          loading={isLoading}
          onPageChange={setPage}
          onView={(customer) => navigate(`/customers/${customer.id}`)}
          onEdit={(customer) => navigate(`/customers/${customer.id}/edit`)}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <CustomerFilters value={filters} onChange={handleFiltersChange} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="lg:ml-auto"
            onClick={() => navigate('/customers/new')}
          >
            Add Customer
          </Button>
        </div>

        <CustomerTable
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
          onView={(customer) => navigate(`/customers/${customer.id}`)}
          onEdit={(customer) => navigate(`/customers/${customer.id}/edit`)}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}

export default CustomersPage;
