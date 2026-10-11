import { Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { LogoutOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useLogout, useMe } from '../../features/auth/index.ts';
import { BRAND } from '../../lib/brand.ts';
import AppHeader from './AppHeader.tsx';
import VetMartLogo from './VetMartLogo.tsx';
import { getAppMenuItems, getPageTitle } from './menuItems.tsx';
import { BottomTabBar, MoreSheet, useIsMobile } from './mobile/index.ts';

const { Sider, Content } = Layout;

/** Bottom bar height (px) — must match `BottomTabBar` grid height. */
const BOTTOM_BAR_HEIGHT = 68;

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useMe();
  const { mutate: signOut, isPending: isLoggingOut } = useLogout();
  const isMobile = useIsMobile();
  const menuItems = getAppMenuItems(user?.role);

  const selectedKey =
    menuItems.find(
      (item) =>
        typeof item?.key === 'string' &&
        location.pathname.startsWith(item.key),
    )?.key ?? '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={220}
          collapsedWidth={80}
          className="vetmart-sider"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
          trigger={
            <button
              type="button"
              className="m-2 flex h-[calc(100%-1rem)] w-[calc(100%-1rem)] cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-900 text-sm text-slate-200"
            >
              {collapsed ? <MenuFoldOutlined /> : 'Collapse'}
            </button>
          }
        >
          <div className={`flex h-16 shrink-0 items-center gap-2 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
            <VetMartLogo />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-semibold text-white">{BRAND.nameEn}</div>
                <div className="truncate text-[10px] text-slate-400">{BRAND.nameBn}</div>
              </div>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[String(selectedKey)]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="vetmart-sider-nav"
          />
          <Menu
            theme="dark"
            mode="inline"
            selectable={false}
            className="vetmart-sider-logout"
            onClick={({ key }) => {
              if (key === 'logout') signOut();
            }}
            items={[
              {
                key: 'logout',
                label: isLoggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট (Logout)',
                icon: <LogoutOutlined />,
                danger: true,
              },
            ]}
          />
        </Sider>
      )}
      <Layout style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 220, minHeight: '100vh' }}>
        <AppHeader title={getPageTitle(location.pathname)} />
        <Content
          style={
            isMobile
              ? { margin: '16px 16px calc(16px + env(safe-area-inset-bottom))', paddingBottom: BOTTOM_BAR_HEIGHT }
              : { margin: 24 }
          }
        >
          <Outlet />
        </Content>
      </Layout>
      {isMobile && (
        <>
          <BottomTabBar onMoreOpen={() => setMoreOpen(true)} />
          <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        </>
      )}
    </Layout>
  );
}

export default AppLayout;
