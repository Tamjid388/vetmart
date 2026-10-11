import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#16A34A',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorInfo: '#0891B2',

		fontFamily: "'Inter', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
		fontSize: 14,
		fontSizeHeading1: 30,
		fontSizeHeading2: 24,
		fontSizeHeading3: 20,
		fontSizeHeading4: 16,
		fontSizeHeading5: 14,



    colorBgBase: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F8FAFC',

    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorBorder: '#CBD5E1',
    colorBorderSecondary: '#E2E8F0',

    borderRadius: 6,
  },
  components: {
    Layout: {
      siderBg: '#0C231A',
      triggerBg: '#0C231A',
      headerBg: '#FFFFFF',
    },
    Menu: {
      darkItemBg: '#0C231A',
      darkSubMenuItemBg: '#0C231A',
      darkItemSelectedBg: '#16A34A',
    },
  },
};
