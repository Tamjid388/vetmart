import { Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router';
import { ProductDetails } from '../../components/ProductDetails/index.ts';
import { useProduct } from '../../hooks/useProduct/index.ts';
import { useMe } from '../../../auth/index.ts';

function ViewProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useMe();
  const { data: product, isLoading } = useProduct(id);

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
            Back to products
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
          { title: <Link to="/products">Products</Link> },
          {
            title: (
              <span className="inline-block max-w-[45vw] truncate align-bottom md:max-w-none">
                {product.name}
              </span>
            ),
          },
        ]}
      />
      <Card
        title={<span className="block truncate">{product.name}</span>}
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            aria-label="Edit product"
            onClick={() => navigate(`/products/${product.id}/edit`)}
          >
            <span className="hidden sm:inline">Edit</span>
          </Button>
        }
      >
        <ProductDetails product={product} showCost={isAdmin} />
      </Card>
    </div>
  );
}

export default ViewProductPage;
