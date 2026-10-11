import { Breadcrumb, Button, Card, Empty, Spin } from 'antd';
import { Link, useNavigate, useParams } from 'react-router';
import { PurchaseDetails } from '../../components/PurchaseDetails/index.ts';
import { usePurchase } from '../../hooks/usePurchase/index.ts';

/**
 * View-only GRN detail (receipt). No purchase edit in v1 (SRS Rule 22) —
 * this route intentionally renders the receipt instead of a form.
 */
function EditPurchasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: purchase, isLoading } = usePurchase(id);

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!purchase) {
    return (
      <Card>
        <Empty description="Purchase not found">
          <Button type="primary" onClick={() => navigate('/purchases')}>
            Back to purchases
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <Breadcrumb
        items={[
          { title: <Link to="/purchases">Purchases</Link> },
          { title: `#${purchase.invoiceNo}` },
        ]}
      />
      <Card>
        <PurchaseDetails purchase={purchase} />
      </Card>
    </div>
  );
}

export default EditPurchasePage;
