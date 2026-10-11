import { App, Breadcrumb } from 'antd';
import { Link, useNavigate } from 'react-router';
import { VendorForm } from '../../components/VendorForm/index.ts';
import { useVendorMutations } from '../../hooks/useVendorMutations/index.ts';
import { getVendorSubmitErrorMessage } from '../../schemas/vendor.schema.ts';
import type { VendorFormValues } from '../../types/index.ts';

function CreateVendorPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { createVendor, isCreating } = useVendorMutations();

  const handleSubmit = (values: VendorFormValues) => {
    createVendor(
      {
        companyName: values.companyName,
        ...(values.contactPerson ? { contactPerson: values.contactPerson } : {}),
        phone: values.phone,
        ...(values.address ? { address: values.address } : {}),
        ...(values.tradeLicense ? { tradeLicense: values.tradeLicense } : {}),
        ...(values.paymentTerms != null ? { paymentTerms: values.paymentTerms } : {}),
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          message.success('Supplier saved');
          navigate('/vendors');
        },
        onError: (error) => {
          message.error(getVendorSubmitErrorMessage(error, 'create'));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/vendors">Suppliers</Link> },
          { title: 'Add Supplier' },
        ]}
      />
      <VendorForm
        mode="create"
        submitting={isCreating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/vendors')}
      />
    </div>
  );
}

export default CreateVendorPage;
