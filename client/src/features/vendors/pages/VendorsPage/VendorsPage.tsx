import { useState } from 'react';
import { App, Button, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { VendorFilters } from '../../components/VendorFilters/index.ts';
import { VendorCardList } from '../../components/VendorCardList/index.ts';
import { VendorTable } from '../../components/VendorTable/index.ts';
import { DEFAULT_VENDOR_FILTERS, PAGE_SIZE } from '../../data/vendor.constants.ts';
import { useVendorMutations } from '../../hooks/useVendorMutations/index.ts';
import { useVendors } from '../../hooks/useVendors/index.ts';
import { getVendorSubmitErrorMessage } from '../../schemas/vendor.schema.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { Vendor, VendorListFilters } from '../../types/index.ts';

function VendorsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { message, modal } = App.useApp();
  const { deleteVendor } = useVendorMutations();
  const [filters, setFilters] = useState<VendorListFilters>(DEFAULT_VENDOR_FILTERS);
  const [page, setPage] = useState(1);
  const { data, total, isLoading } = useVendors({
    searchTerm: filters.search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const handleFiltersChange = (next: VendorListFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleDelete = (vendor: Vendor) => {
    modal.confirm({
      title: 'Delete supplier',
      content: `Delete “${vendor.companyName}”? This cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteVendor(vendor.id, {
          onSuccess: () => {
            message.success('Supplier deleted');
          },
          onError: (error) => {
            message.error(getVendorSubmitErrorMessage(error, 'update'));
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
          onClick={() => navigate('/vendors/new')}
        >
          Add Supplier
        </Button>
        <VendorFilters value={filters} onChange={handleFiltersChange} />
        <VendorCardList
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          loading={isLoading}
          onPageChange={setPage}
          onView={(vendor) => navigate(`/vendors/${vendor.id}`)}
          onEdit={(vendor) => navigate(`/vendors/${vendor.id}/edit`)}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <VendorFilters value={filters} onChange={handleFiltersChange} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="lg:ml-auto"
            onClick={() => navigate('/vendors/new')}
          >
            Add Supplier
          </Button>
        </div>

        <VendorTable
          data={data}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
          onView={(vendor) => navigate(`/vendors/${vendor.id}`)}
          onEdit={(vendor) => navigate(`/vendors/${vendor.id}/edit`)}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}

export default VendorsPage;
