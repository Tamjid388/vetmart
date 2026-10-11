import { Avatar, Badge, Button, Input, Typography } from 'antd';
import { BellOutlined, SearchOutlined } from '@ant-design/icons';
import { useMe } from '../../features/auth/index.ts';

type AppHeaderProps = {
  title: string;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * App header — desktop single row is unchanged (`md:` classes restore the
 * original `h-16 px-6` row exactly); on mobile the row wraps so the search
 * input drops full-width below the title + bell + avatar row.
 */
function AppHeader({ title }: AppHeaderProps) {
  const { user } = useMe();
  const displayName = user?.name?.trim() || user?.email || 'Staff account';
  const displayRole = user?.role === 'admin' ? 'সুপার অ্যাডমিন' : 'স্টাফ (Staff)';
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-slate-300 bg-white px-4 py-2 md:h-16 md:flex-nowrap md:gap-4 md:px-6 md:py-0">
      <Typography.Title level={4} className="!mb-0 shrink-0">
        {title}
      </Typography.Title>

      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="দ্রুত খুঁজুন - পণ্য, ব্যাচ, বিক্রি..."
        className="order-3 w-full basis-full md:order-none md:mx-auto md:w-auto md:max-w-xl md:basis-auto"
      />

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <Badge dot offset={[-2, 2]}>
          <Button shape="circle" icon={<BellOutlined />} aria-label="Notifications" />
        </Badge>
        <div className="flex items-center gap-2">
          <Avatar style={{ backgroundColor: '#16A34A' }}>{getInitials(displayName)}</Avatar>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium text-slate-800">{displayName}</div>
            <div className="text-xs text-slate-500">{displayRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
