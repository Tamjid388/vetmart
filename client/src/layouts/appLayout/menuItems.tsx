import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { BRAND } from '../../lib/brand.ts';
import {
  AuditOutlined,
  BarChartOutlined,
  BookOutlined,
  ContactsOutlined,
  DashboardOutlined,
  DollarOutlined,
  LoginOutlined,
  MedicineBoxOutlined,
  MenuOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';

export type AppMenuItem = NonNullable<MenuProps['items']>[number] & {
  /** Roles allowed to see this item. Empty/undefined = every signed-in role. */
  roles?: string[];
};

export const ADMIN_ONLY: string[] = ['admin'];

export type MenuGroupKey = 'overview' | 'inventory' | 'salesParties' | 'insights' | 'system';

export const MENU_GROUPS: { key: MenuGroupKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'salesParties', label: 'Sales & Parties' },
  { key: 'insights', label: 'Insights' },
  { key: 'system', label: 'System' },
];

export const ROUTE_GROUP_MAP: Record<string, MenuGroupKey> = {
  '/dashboard': 'overview',
  '/products': 'inventory',
  '/categories': 'inventory',
  '/purchases': 'inventory',
  '/sales': 'salesParties',
  '/customers': 'salesParties',
  '/customer-ledger': 'salesParties',
  '/vendors': 'salesParties',
  '/vendor-ledger': 'salesParties',
  '/payments': 'salesParties',
  '/reports': 'insights',
  '/audits': 'insights',
  '/settings': 'system',
  '/auth/login': 'system',
};

export const appMenuItems: AppMenuItem[] = [
  { key: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/products', label: 'পণ্য (Products)', icon: <MedicineBoxOutlined /> },
  { key: '/categories', label: 'ক্যাটাগরি (Categories)', icon: <TagsOutlined />, roles: ADMIN_ONLY },
  { key: '/purchases', label: 'ক্রয় (Purchase)', icon: <ShoppingCartOutlined />, roles: ADMIN_ONLY },
  { key: '/sales', label: 'বিক্রি (Sales)', icon: <ShopOutlined /> },
  { key: '/customers', label: 'কাস্টমার (Customer)', icon: <TeamOutlined /> },
  { key: '/customer-ledger', label: 'কাস্টমার লেজার (Customer Ledger)', icon: <BookOutlined /> },
  { key: '/vendors', label: 'ভেন্ডর (Vendor)', icon: <ContactsOutlined /> },
  { key: '/vendor-ledger', label: 'ভেন্ডর লেজার (Vendor Ledger)', icon: <BookOutlined />, roles: ADMIN_ONLY },
  { key: '/payments', label: 'পেমেন্ট (Payments)', icon: <DollarOutlined /> },
  { key: '/reports', label: 'রিপোর্ট (Reports)', icon: <BarChartOutlined />, roles: ADMIN_ONLY },
  { key: '/audits', label: 'অডিট (Audit)', icon: <AuditOutlined />, roles: ADMIN_ONLY },
  { key: '/settings', label: 'সেটিংস (Settings)', icon: <SettingOutlined /> },
  { key: '/auth/login', label: 'লগইন (Login)', icon: <LoginOutlined /> },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'ড্যাশবোর্ড (Dashboard)',
  '/products': 'পণ্য (Products)',
  '/categories': 'ক্যাটাগরি (Categories)',
  '/purchases': 'ক্রয় (Purchase)',
  '/sales': 'বিক্রি (Sales)',
  '/customers': 'কাস্টমার (Customer)',
  '/customer-ledger': 'কাস্টমার লেজার (Customer Ledger)',
  '/vendors': 'ভেন্ডর (Vendor)',
  '/vendor-ledger': 'Vendor Ledger',
  '/payments': 'পেমেন্ট (Payments)',
  '/reports': 'রিপোর্ট (Reports)',
  '/audits': 'অডিট (Audit)',
  '/settings': 'সেটিংস (Settings)',
  '/auth/login': 'লগইন (Login)',
};

/** Flat filtered list — single source for role filtering. Grouping builds on top of this. */
export function getFlatMenuItems(role?: string): AppMenuItem[] {
  return appMenuItems.filter((item) => {
    // The in-app Login entry is redundant once signed in.
    if (typeof item?.key === 'string' && item.key.startsWith('/auth') && role) {
      return false;
    }
    const allowed = (item as AppMenuItem)?.roles;
    if (!allowed || allowed.length === 0) return true;
    return !!role && allowed.includes(role);
  });
}

/** Returns menu items visible for the given role, grouped under labeled sections. Staff never sees admin-only entries. Empty groups are dropped. */
export function getAppMenuItems(role?: string): AppMenuItem[] {
  const flat = getFlatMenuItems(role);
  const byGroup = new Map<MenuGroupKey, AppMenuItem[]>();
  for (const item of flat) {
    const key = typeof item?.key === 'string' ? (item.key as string) : '';
    const group = ROUTE_GROUP_MAP[key] ?? 'system';
    const list = byGroup.get(group);
    if (list) list.push(item);
    else byGroup.set(group, [item]);
  }
  const grouped: AppMenuItem[] = [];
  for (const group of MENU_GROUPS) {
    const children = byGroup.get(group.key);
    if (!children || children.length === 0) continue;
    grouped.push({
      type: 'group',
      key: group.key,
      label: group.label,
      children,
    } as AppMenuItem);
  }
  return grouped;
}

export function getPageTitle(pathname: string): string {
  const match = appMenuItems.find(
    (item) => typeof item.key === 'string' && pathname.startsWith(item.key),
  );

  if (typeof match?.key === 'string' && pageTitles[match.key]) {
    return pageTitles[match.key];
  }

  return BRAND.nameEn;
}

// --- E8a: bottom tab navigation (mobile) ---

export type BottomTabDef = {
  /** Route prefix this tab highlights for (deep routes via startsWith). 'more' for the sheet opener. */
  key: string;
  label: string;
  icon: ReactNode;
  /** Undefined for the More sheet opener (does not navigate). */
  route?: string;
  isMore?: boolean;
};

/** Fixed tab order per `docs/designs/Bottom navigation.png`. */
export const bottomTabDefs: BottomTabDef[] = [
  { key: '/dashboard', label: 'হোম', icon: <DashboardOutlined />, route: '/dashboard' },
  { key: '/sales', label: 'বিক্রি', icon: <ShopOutlined />, route: '/sales' },
  { key: '/products', label: 'পণ্য', icon: <MedicineBoxOutlined />, route: '/products' },
  { key: '/payments', label: 'পেমেন্ট', icon: <DollarOutlined />, route: '/payments' },
  { key: 'more', label: 'আরও', icon: <MenuOutlined />, isMore: true },
];

/** Routes with a dedicated bottom tab. Everything else lives in the More sheet. */
export const BOTTOM_TAB_ROUTES: string[] = bottomTabDefs
  .filter((tab) => tab.route)
  .map((tab) => tab.route as string);

/**
 * Active bottom-tab key for a pathname (deep-route prefix match,
 * same `startsWith` logic AppLayout uses for the desktop Sider).
 * Returns null for overflow routes (customers/vendors/purchases/reports/settings).
 */
export function getBottomTabKey(pathname: string): string | null {
  const match = bottomTabDefs.find(
    (tab) => tab.route && (pathname === tab.route || pathname.startsWith(`${tab.route}/`)),
  );
  return match?.key ?? null;
}

/**
 * More-sheet rows: everything in `getAppMenuItems(role)` not covered by the
 * 4 primary tabs. Keeps a single permission source of truth — admin-only
 * routes (Purchases, Reports) are filtered by `getAppMenuItems` itself.
 */
export type MoreSheetRow = {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
};

export function getMoreSheetSections(role?: string): { groupLabel: string; items: MoreSheetRow[] }[] {
  const flat = getFlatMenuItems(role).filter(
    (item) => typeof item?.key === 'string' && !BOTTOM_TAB_ROUTES.includes(item.key as string),
  );
  const byGroup = new Map<MenuGroupKey, MoreSheetRow[]>();
  for (const item of flat) {
    const entry = item as { key: string; label?: ReactNode; icon?: ReactNode };
    const group = ROUTE_GROUP_MAP[entry.key] ?? 'system';
    const row: MoreSheetRow = { key: entry.key, label: entry.label, icon: entry.icon };
    const list = byGroup.get(group);
    if (list) list.push(row);
    else byGroup.set(group, [row]);
  }
  const sections: { groupLabel: string; items: MoreSheetRow[] }[] = [];
  for (const group of MENU_GROUPS) {
    const items = byGroup.get(group.key);
    if (!items || items.length === 0) continue;
    sections.push({ groupLabel: group.label, items });
  }
  return sections;
}

export function getMoreSheetItems(role?: string): MoreSheetRow[] {
  return getMoreSheetSections(role).flatMap((section) => section.items);
}
