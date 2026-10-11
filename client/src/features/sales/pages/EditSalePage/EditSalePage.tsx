import { Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { SaleDetails } from '../../components/SaleDetails/index.ts';
import { useSale } from '../../hooks/useSale/index.ts';

/**
 * View-only sale detail (receipt). No sale edit in v1 (SRS Rule 19) —
 * this route intentionally renders the receipt instead of a form.
 */
function EditSalePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!sale) {
    return (
      <Card>
        <Empty description="Sale not found">
          <Button type="primary" onClick={() => navigate('/sales')}>
            Back to sales
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/sales">Sales</Link> },
          { title: `#${sale.invoiceNo}` },
        ]}
      />
      <Card>
        <SaleDetails sale={sale} />
      </Card>
    </div>
  );
}

export default EditSalePage;
