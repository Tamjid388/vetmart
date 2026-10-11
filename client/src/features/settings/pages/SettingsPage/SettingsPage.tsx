import { Card, Typography } from 'antd';
import { useMe } from '../../../auth/index.ts';
import { StaffManagementSection } from '../../../users/index.ts';

function SettingsPage() {
  const { user, isAdmin } = useMe();

  return (
    <div className="flex flex-col gap-4">
      <Card title="Profile">
        <Typography.Text>
          Signed in as <strong>{user?.email ?? '—'}</strong>
          {user?.name ? ` (${user.name})` : ''} — role: <strong>{user?.role ?? '—'}</strong>
        </Typography.Text>
      </Card>

      {isAdmin ? (
        <StaffManagementSection />
      ) : (
        <Card title="Staff Management">
          <Typography.Paragraph type="secondary" className="mb-0">
            Only admins can manage user accounts.
          </Typography.Paragraph>
        </Card>
      )}
    </div>
  );
}

export default SettingsPage;
