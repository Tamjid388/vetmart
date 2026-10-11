import { App, Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { VendorForm } from '../../components/VendorForm/index.ts';
import { useVendor } from '../../hooks/useVendor/index.ts';
import { useVendorMutations } from '../../hooks/useVendorMutations/index.ts';
import { getVendorSubmitErrorMessage } from '../../schemas/vendor.schema.ts';
import type { VendorFormValues } from '../../types/index.ts';

function EditVendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: vendor, isLoading } = useVendor(id);
  const { updateVendor, isUpdating } = useVendorMutations();

  const handleSubmit = (values: VendorFormValues) => {
    if (!id) return;
    updateVendor(
      {
        id,
        payload: {
          companyName: values.companyName,
          contactPerson: values.contactPerson,
          phone: values.phone,
          address: values.address,
          tradeLicense: values.tradeLicense,
          paymentTerms: values.paymentTerms,
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => {
          message.success('Supplier updated');
          navigate('/vendors');
        },
        onError: (error) => {
          message.error(getVendorSubmitErrorMessage(error, 'update'));
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

  if (!vendor) {
    return (
      <Card>
        <Empty description="Supplier not found">
          <Button type="primary" onClick={() => navigate('/vendors')}>
            Back to suppliers
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/vendors">Suppliers</Link> },
          { title: 'Edit Supplier' },
        ]}
      />
      <VendorForm
        key={vendor.id}
        mode="edit"
        initialValues={vendor}
        submitting={isUpdating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/vendors')}
      />
    </div>
  );
}

export default EditVendorPage;
