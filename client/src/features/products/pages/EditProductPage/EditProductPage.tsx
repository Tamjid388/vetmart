import { App, Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { ProductForm } from '../../components/ProductForm/index.ts';
import { useProduct } from '../../hooks/useProduct/index.ts';
import { useProductMutations } from '../../hooks/useProductMutations/index.ts';
import type { UpdateProductPayload } from '../../types/index.ts';

function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: product, isLoading } = useProduct(id);
  const { updateProduct, isUpdating } = useProductMutations();

  const handleSubmit = (payload: UpdateProductPayload) => {
    if (!id) return;
    updateProduct(
      { id, payload },
      {
        onSuccess: () => {
          message.success('Product updated');
          navigate('/products');
        },
        onError: () => {
          message.error('Failed to update product');
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

  if (!product) {
    return (
      <Card>
        <Empty description="Product not found">
          <Button type="primary" onClick={() => navigate('/products')}>
            Back to catalog
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/products">Products</Link> },
          { title: 'Edit Product' },
        ]}
      />
      <ProductForm
        key={product.id}
        mode="edit"
        initialValues={product}
        submitting={isUpdating}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/products')}
      />
    </div>
  );
}

export default EditProductPage;
