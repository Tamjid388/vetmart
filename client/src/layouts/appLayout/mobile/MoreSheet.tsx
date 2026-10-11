import { Avatar, Button, Drawer, List, Typography } from 'antd';
import { CloseOutlined, LogoutOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router';
import { useLogout, useMe } from '../../../features/auth/index.ts';
import { getMoreSheetItems } from '../menuItems.tsx';

type MoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * E8a overflow sheet for the আরও (More) tab — bottom Drawer with every route
 * not in the 4 primary tabs, role-filtered via `getAppMenuItems(role)`.
 */
function MoreSheet({ open, onClose }: MoreSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useMe();
  const { mutate: signOut, isPending: isLoggingOut } = useLogout();

  const displayName = user?.name?.trim() || user?.email || 'Staff account';
  const displayRole = user?.role === 'admin' ? 'সুপার অ্যাডমিন' : 'স্টাফ (Staff)';
  const rows = getMoreSheetItems(user?.role);

  const go = (key: string) => {
    onClose();
    navigate(key);
  };

  return (
    <Drawer
      placement="bottom"
      height="auto"
      open={open}
      onClose={onClose}
      title="আরও (More)"
      closable
      closeIcon={<CloseOutlined aria-label="বন্ধ করুন (Close sheet)" />}
      className="md:hidden"
      styles={{
        body: { paddingBottom: 8 },
        footer: { paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' },
      }}
      footer={
        <Button block size="large" onClick={onClose}>
          বন্ধ করুন (Close)
        </Button>
      }
    >
      <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
        <Avatar style={{ backgroundColor: '#16A34A' }}>
          {(displayName[0] ?? 'S').toUpperCase()}
        </Avatar>
        <div className="leading-tight">
          <div className="text-sm font-medium text-slate-800">{displayName}</div>
          <div className="text-xs text-slate-500">{displayRole}</div>
        </div>
      </div>
      <List
        dataSource={rows}
        renderItem={(item) => {
          const key = item.key;
          const isActive =
            !!key && (location.pathname === key || location.pathname.startsWith(`${key}/`));
          return (
            <List.Item
              onClick={() => go(key)}
              className={`cursor-pointer !px-2 ${isActive ? '!bg-green-50' : ''}`}
            >
              <List.Item.Meta
                avatar={<span className="text-lg text-slate-600">{item.icon}</span>}
                title={
                  <Typography.Text strong={isActive} style={isActive ? { color: '#16A34A' } : undefined}>
                    {item.label}
                  </Typography.Text>
                }
              />
            </List.Item>
          );
        }}
      />
      <button
        type="button"
        disabled={isLoggingOut}
        onClick={() => {
          onClose();
          signOut();
        }}
        className="mt-2 flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-2 py-2 text-left text-sm font-medium text-red-600 disabled:cursor-wait disabled:opacity-60"
      >
        <LogoutOutlined className="text-lg" />
        {isLoggingOut ? 'লগআউট হচ্ছে…' : 'লগআউট (Logout)'}
      </button>
    </Drawer>
  );
}

export default MoreSheet;
