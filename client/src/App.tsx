import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider, message } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router/dom';
import router from './router/router';
import { queryClient } from './lib/queryClient';
import { getApiErrorMessage } from './lib/axios/axios';
import { useIsMobile } from './layouts/appLayout/mobile/index.ts';
import { theme } from './theme';

function AppInner() {
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    queryClient.getQueryCache().config.onError = (error) => {
      messageApi.error(getApiErrorMessage(error));
    };
    queryClient.getMutationCache().config.onError = (error) => {
      messageApi.error(getApiErrorMessage(error));
    };
  }, [messageApi]);

  return (
    <>
      {contextHolder}
      <RouterProvider router={router} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <AntdApp>
          <AppInner />
        </AntdApp>
      </ConfigProvider>
      {import.meta.env.DEV && <DevtoolsPosition />}
    </QueryClientProvider>
  );
}

/**
 * E8a: the devtools floating button sits bottom-right by default, which would
 * cover the mobile bottom tab bar — render it only on desktop viewports.
 */
function DevtoolsPosition() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />;
}
