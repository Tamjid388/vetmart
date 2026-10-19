import { Alert, Button, Divider, Form, Input, Typography } from 'antd';
import {
  BarChartOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  MedicineBoxOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLogin } from '../../hooks/index.ts';
import type { LoginPayload } from '../../types/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { BRAND } from '../../../../lib/brand.ts';
import VetMartLogo from '../../../../layouts/appLayout/VetMartLogo.tsx';

/** Legacy localStorage token key from the pre-cookie auth era — must stay absent. */
const LEGACY_TOKEN_KEY = 'vetmart:accessToken';

const inputClassName =
  'h-11 !rounded-lg !border-slate-200 !bg-slate-50 hover:!border-slate-300 focus:!border-green-600';

// NOTE: demo-only seed accounts for quick login during development.
// Remove this section before production release.
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin2@gmail.com', password: 'Admin123!' },
  { label: 'Staff', email: 'staff@vetmart.com', password: 'Staff123!' },
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const { mutate: signIn, isPending, isError, error } = useLogin();

  // Drop any token left over from the pre-cookie implementation.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {
      // storage unavailable — ignore
    }
  }, []);

  const handleFinish = (values: LoginPayload) => {
    signIn(values, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    });
  };

  const handleDemoLogin = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    signIn(
      { email: account.email, password: account.password },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <aside className="relative flex flex-col justify-between gap-3 overflow-hidden bg-[#0C231A] px-6 py-4 sm:px-8 lg:h-screen lg:w-[42%] lg:gap-0 lg:px-10 lg:py-8 xl:w-[44%] xl:px-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 10% 0%, rgba(34,197,94,0.28), transparent 55%)',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <VetMartLogo className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight text-white">{BRAND.nameEn}</div>
              <div className="text-sm font-medium text-slate-300">{BRAND.nameBn}</div>
            </div>
          </div>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400 lg:mt-6">
            Sign in to manage inventory, sales, vendors, and ledgers for your veterinary
            pharmacy — stock figures stay inside the workspace.
          </p>
        </div>

        <div className="relative mt-8 hidden rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm sm:block">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Built for animal health pharmacies</div>
            <div className="mt-0.5 text-xs text-slate-400">
              Everything you need after you sign in
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-400">
                <MedicineBoxOutlined />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-100">Inventory & purchasing</div>
                <div className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  Vaccines, antibiotics, and farm supplies in one catalog
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <ShopOutlined />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-100">Sales & POS</div>
                <div className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  Dispense, invoice, and track customer orders
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                <BarChartOutlined />
              </span>
              <div>
                <div className="text-sm font-medium text-slate-100">Reports & ledgers</div>
                <div className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  Purchases, payments, and farm-level reporting
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 hidden flex-wrap gap-2 xl:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
            <span className="font-semibold text-green-400">99.9%</span> Uptime
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
            <span className="font-semibold text-green-400">AUDIT</span> Ready records
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
            <span className="font-semibold text-green-400">SECURE</span> Encrypted access
          </span>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-white px-6 py-8 sm:px-10 lg:h-screen lg:overflow-y-auto lg:py-6">
        <div className="m-auto w-full max-w-[420px]">
          <Typography.Title level={2} className="!mb-1 !text-slate-900">
            Welcome back
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="!mb-6">
            Enter your credentials to access your ERP portal
          </Typography.Paragraph>

          <Form layout="vertical" requiredMark={false} onFinish={handleFinish}>
            {isError && (
              <Alert
                type="error"
                showIcon
                message={getApiErrorMessage(error, 'Invalid email or password')}
                className="mb-4"
              />
            )}
            <Form.Item
              label={<span className="font-semibold text-slate-800">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="name@pharmacy.com"
                className={inputClassName}
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-slate-800">Password</span>}
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="Enter secure password"
                className={inputClassName}
                iconRender={(visible) =>
                  visible ? (
                    <EyeOutlined className="text-slate-400" />
                  ) : (
                    <EyeInvisibleOutlined className="text-slate-400" />
                  )
                }
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isPending}
              className="!h-11 !font-semibold"
            >
              Sign In to Workspace
            </Button>
          </Form>

          <Divider className="!my-5 !text-xs !text-slate-400">Quick demo login</Divider>

          <div className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                size="large"
                block
                loading={isPending}
                onClick={() => handleDemoLogin(account)}
                className="!h-auto !py-2"
              >
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-semibold">Login as {account.label}</span>
                  <span className="text-xs font-normal text-slate-400">{account.email}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
