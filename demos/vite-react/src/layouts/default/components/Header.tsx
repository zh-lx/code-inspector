import type { ReactNode, CSSProperties } from 'react';
import { Layout, theme } from 'antd';
const { Header } = Layout;

export default function LayoutHeader({
  children,
  style = {}
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const {
    token: { colorBgContainer }
  } = theme.useToken();
  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 16px',
        backgroundColor: colorBgContainer,
        ...style
      }}
    >
      {children}
    </Header>
  );
}
