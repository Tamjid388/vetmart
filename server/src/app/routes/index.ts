import { Router } from 'express';
import { AuthRoutes, UserRoutes } from '../modules/users/user.routes.js';
import { ProductRoutes } from '../modules/products/product.routes.js';
import { CategoryRoutes } from '../modules/categories/category.routes.js';
import { CustomerRoutes } from '../modules/customers/customer.routes.js';
import { SupplierRoutes } from '../modules/suppliers/supplier.routes.js';
import { SaleRoutes } from '../modules/sales/sale.routes.js';
import { PurchaseRoutes } from '../modules/purchases/purchase.routes.js';
import { PaymentRoutes } from '../modules/payments/payment.routes.js';
import { AuditRoutes } from '../modules/audits/audit.routes.js';
import { DashboardRoutes } from '../modules/dashboard/dashboard.routes.js';
import { ReportRoutes } from '../modules/reports/report.routes.js';

export const appRoutes = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  { path: '/auth', route: AuthRoutes },
  { path: '/users', route: UserRoutes },
  { path: '/products', route: ProductRoutes },
  { path: '/categories', route: CategoryRoutes },
  { path: '/customers', route: CustomerRoutes },
  { path: '/suppliers', route: SupplierRoutes },
  { path: '/sales', route: SaleRoutes },
  { path: '/purchases', route: PurchaseRoutes },
  { path: '/payments', route: PaymentRoutes },
  { path: '/audits', route: AuditRoutes },
  { path: '/dashboard', route: DashboardRoutes },
  { path: '/reports', route: ReportRoutes },
];

for (const { path, route } of moduleRoutes) {
  appRoutes.use(path, route);
}
