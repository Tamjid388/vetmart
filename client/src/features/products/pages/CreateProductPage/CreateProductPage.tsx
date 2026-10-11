import { App, Breadcrumb } from 'antd';
import { Link, useNavigate } from 'react-router';
import { ProductForm } from '../../components/ProductForm/index.ts';
import { useProductMutations } from '../../hooks/useProductMutations/index.ts';
import type { CreateProductPayload, UpdateProductPayload } from '../../types/index.ts';

function CreateProductPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { createProduct, isCreating } = useProductMutations();

  const handleSubmit = (payload: CreateProductPayload | UpdateProductPayload) => {
    // ProductForm in create mode always emits a CreateProductPayload.
    createProduct(payload as CreateProductPayload, {
      onSuccess: () => {
        message.success('Product saved');
        navigate('/products');
      },
      onError: () => {
        message.error('Failed to create product');
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/products">Products</Link> },
          { title: 'Add Product' },
        ]}
      />
      <ProductForm
        mode="create"
        submitting={isCreating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/products')}
      />
    </div>
  );
}

export default CreateProductPage;
