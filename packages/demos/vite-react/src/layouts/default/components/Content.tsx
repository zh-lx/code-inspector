import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Loading from '@/components/Loading';
import { useSelector } from 'react-redux';
import config from '@/config';

const { Content } = Layout;

export default function LayoutContent() {
  const layoutMode = useSelector(selectLayoutMode);
  const isFixedWidth = useSelector(selectIsFixedWidth);
  const fixedWidthStyle =
    layoutMode === 'topmenu' && isFixedWidth
      ? { width: config.fixedWidth, margin: '16px auto 0' }
      : undefined;
  return (
    <Content className="site-content" style={fixedWidthStyle}>
      <Suspense fallback={<Loading height="100%" />}>
        <Outlet />
      </Suspense>
    </Content>
  );
}
