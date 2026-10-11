import { App, Avatar, Breadcrumb, Button, Card, Divider, Empty, Spin, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Link, useNavigate, useParams } from 'react-router';
import { VendorDetails } from '../../components/VendorDetails/index.ts';
import { useVendor } from '../../hooks/useVendor/index.ts';
import { useVendorMutations } from '../../hooks/useVendorMutations/index.ts';
import { getVendorSubmitErrorMessage } from '../../schemas/vendor.schema.ts';
import { formatSupplierId, formatTaka, getInitials } from '../../utils/format.ts';

function ViewVendorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { data: vendor, isLoading } = useVendor(id);
  const { deleteVendor, isDeleting } = useVendorMutations();

  const handleDelete = () => {
    if (!vendor) return;
    modal.confirm({
      title: 'Delete supplier',
      content: `Delete “${vendor.companyName}”? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteVendor(vendor.id, {
          onSuccess: () => {
            message.success('Supplier deleted');
            navigate('/vendors');
          },
          onError: (error) => {
            message.error(getVendorSubmitErrorMessage(error, 'update'));
          },
        });
      },
    });
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
    <div className="flex flex-col gap-3 md:gap-4">
      <Breadcrumb
        className="[&>ol]:flex-wrap"
        items={[
          { title: <Link to="/vendors">Suppliers</Link> },
          {
            title: (
              <span className="inline-block max-w-[45vw] truncate align-bottom md:max-w-none">
                {vendor.companyName}
              </span>
            ),
          },
        ]}
      />
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar size={64} className="shrink-0 !bg-blue-600 !text-xl">
              {getInitials(vendor.companyName)}
            </Avatar>
            <div className="min-w-0">
              <Typography.Title level={3} className="!mb-0 truncate">
                {vendor.companyName}
              </Typography.Title>
              <div className="mt-0.5 text-sm text-slate-500">
                {formatSupplierId(vendor.id)} · {vendor.phone}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Tag color={vendor.isActive ? 'success' : 'default'}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {vendor.contactPerson && <Tag color="blue">{vendor.contactPerson}</Tag>}
                {vendor.payableBalance > 0 && (
                  <Tag color="warning">Payable {formatTaka(vendor.payableBalance)}</Tag>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
            >
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        <Divider className="!my-5" />

        <VendorDetails vendor={vendor} />
      </Card>
    </div>
  );
}

export default ViewVendorPage;
