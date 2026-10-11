import { useState } from 'react';
import { Alert, App, Button, Card, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { VendorSearchSelect, useVendor } from '../../../vendors/index.ts';
import { PaymentFilters } from '../../components/PaymentFilters/index.ts';
import { PaymentCardList } from '../../components/PaymentCardList/index.ts';
import { PaymentTable } from '../../components/PaymentTable/index.ts';
import { VendorPaymentForm } from '../../components/VendorPaymentForm/index.ts';
import { DEFAULT_PAYMENT_FILTERS, PAGE_SIZE } from '../../data/payment.constants.ts';
import { usePaymentMutations } from '../../hooks/usePaymentMutations/index.ts';
import { usePayments } from '../../hooks/usePayments/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import type { CreatePaymentPayload, PaymentListFilters, PaymentResponse } from '../../types/index.ts';

/** Single switch point — both tabs render cards below md, table on desktop. */
function PaymentCardListOrTable({
  data,
  page,
  total,
  loading,
  onPageChange,
}: {
  data: PaymentResponse[];
  page: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <PaymentCardList
        data={data}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        loading={loading}
        onPageChange={onPageChange}
      />
    );
  }
  return (
    <PaymentTable
      data={data}
      page={page}
      pageSize={PAGE_SIZE}
      total={total}
      isLoading={loading}
      onPageChange={onPageChange}
    />
  );
}

function VendorPaymentsTab() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { createPayment, isCreating, createError } = usePaymentMutations();
  const { data: vendor } = useVendor(vendorId ?? undefined);
  const { data, total, isLoading } = usePayments({
    supplierId: vendorId ?? '___none___',
    page,
    limit: PAGE_SIZE,
  });

  const handleVendorChange = (id: string | null) => {
    setVendorId(id);
    setPage(1);
  };

  const handleSubmit = (payload: CreatePaymentPayload) => {
    createPayment(payload, {
      onSuccess: (payment) => {
        message.success(`Payment of ${payment.amount} recorded`);
      },
      onError: (error) => {
        message.error(getApiErrorMessage(error, 'Failed to record payment'));
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <VendorPaymentForm
        key={vendorId ?? 'none'}
        initialSupplierId={vendorId}
        submitting={isCreating}
        serverError={createError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/payments')}
      />
      <div>
        <div className="mb-3 max-w-xs">
          <VendorSearchSelect
            value={vendorId}
            onChange={handleVendorChange}
            placeholder="Filter history by supplier"
            onCreateNew={() => navigate('/vendors/new')}
          />
        </div>
        <PaymentCardListOrTable
          data={vendorId ? data : []}
          page={page}
          total={vendorId ? total : 0}
          loading={isLoading}
          onPageChange={setPage}
        />
        {vendorId && vendor && vendor.payableBalance <= 0 && (
          <div className="mt-2 text-sm text-slate-500">
            {vendor.companyName} has no outstanding payable.
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PaymentListFilters>(DEFAULT_PAYMENT_FILTERS);
  const [page, setPage] = useState(1);
  const { data, total, isLoading } = usePayments({
    page,
    limit: PAGE_SIZE,
    method: filters.method === 'all' ? undefined : filters.method,
  });

  const handleFiltersChange = (next: PaymentListFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert
        type="success"
        showIcon
        message="পেমেন্ট কীভাবে কাজ করে?"
        description={
          <ul className="mt-1 flex flex-col gap-1 pl-5" style={{ listStyleType: 'disc' }}>
            <li>
              <b>কাস্টমার ট্যাব:</b> কাস্টমার আপনার কাছে বাকিতে মাল নিয়েছে — সেই বাকি টাকা
              আদায় এখানে করবেন।
            </li>
            <li>
              <b>ভেন্ডর ট্যাব:</b> আপনি সাপ্লায়ারের কাছে বাকিতে মাল কিনেছেন — সেই বাকি
              টাকা পরিশোধ এখানে করবেন।
            </li>
            <li>মনে রাখুন: এখানে টাকা দিলে/নিলে স্টক বাড়বে-কমবে না, শুধু বাকির হিসাব কমবে।</li>
          </ul>
        }
      />
      <Card>
        <Tabs
          defaultActiveKey="customers"
          items={[
            {
              key: 'customers',
              label: 'Customers',
              children: (
                <div>
                  <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <PaymentFilters value={filters} onChange={handleFiltersChange} />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="lg:ml-auto"
                      onClick={() => navigate('/payments/new')}
                    >
                      Record Payment
                    </Button>
                  </div>

                  <PaymentCardListOrTable
                    data={data}
                    page={page}
                    total={total}
                    loading={isLoading}
                    onPageChange={setPage}
                  />
                </div>
              ),
            },
            {
              key: 'vendors',
              label: 'Vendors',
              children: <VendorPaymentsTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}

export default PaymentsPage;
