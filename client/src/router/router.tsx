import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from '../features/auth';
import { AppLayout, AuthLayout } from '../layouts';
import { RequireAdmin, RequireAuth } from './guards.tsx';
import {
  CustomersPage,
  CreateCustomerPage,
  ViewCustomerPage,
  EditCustomerPage,
} from '../features/customers';
import {
  ProductsPage,
  CreateProductPage,
  EditProductPage,
  ViewProductPage,
} from '../features/products';
import { CategoriesPage } from '../features/categories';
import { DashboardPage } from '../features/dashboard';
import {
  PurchasesPage,
  CreatePurchasePage,
  EditPurchasePage,
} from '../features/purchases';
import {
  SalesPage,
  CreateSalePage,
  EditSalePage,
} from '../features/sales';
import {
  VendorsPage,
  CreateVendorPage,
  ViewVendorPage,
  EditVendorPage,
} from '../features/vendors';
import {
  PaymentsPage,
  CreatePaymentPage,
  EditPaymentPage,
} from '../features/payments';
import { ReportsPage } from '../features/reports';
import { SettingsPage } from '../features/settings';
import { AuditsPage } from '../features/audits';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', Component: DashboardPage },
      { path: 'customers', Component: CustomersPage },
      { path: 'customers/new', Component: CreateCustomerPage },
      { path: 'customers/:id', Component: ViewCustomerPage },
      { path: 'customers/:id/edit', Component: EditCustomerPage },
      { path: 'products', Component: ProductsPage },
      { path: 'products/new', Component: CreateProductPage },
      { path: 'products/:id', Component: ViewProductPage },
      { path: 'products/:id/edit', Component: EditProductPage },
      { path: 'categories', element: <RequireAdmin />, children: [{ index: true, Component: CategoriesPage }] },
      { path: 'purchases', element: <RequireAdmin />, children: [{ index: true, Component: PurchasesPage }] },
      { path: 'purchases/new', element: <RequireAdmin />, children: [{ index: true, Component: CreatePurchasePage }] },
      { path: 'purchases/:id/edit', element: <RequireAdmin />, children: [{ index: true, Component: EditPurchasePage }] },
      { path: 'sales', Component: SalesPage },
      { path: 'sales/new', Component: CreateSalePage },
      { path: 'sales/:id/edit', Component: EditSalePage },
      { path: 'vendors', Component: VendorsPage },
      { path: 'vendors/new', Component: CreateVendorPage },
      { path: 'vendors/:id', Component: ViewVendorPage },
      { path: 'vendors/:id/edit', Component: EditVendorPage },
      { path: 'payments', Component: PaymentsPage },
      { path: 'payments/new', Component: CreatePaymentPage },
      { path: 'payments/:id/edit', Component: EditPaymentPage },
      { path: 'reports', element: <RequireAdmin />, children: [{ index: true, Component: ReportsPage }] },
      { path: 'audits', element: <RequireAdmin />, children: [{ index: true, Component: AuditsPage }] },
      { path: 'settings', Component: SettingsPage },
    ],
  },
  {
    path: '/auth',
    Component: AuthLayout,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', Component: LoginPage },
    ],
  },
]);

export default router;
