import { Layout, theme, Menu } from 'antd';
import Content from './components/Content';
import Logo from './components/Logo';
import HeaderActions from './components/HeaderActions';
import Footer from './components/Footer';
import useMenu from './useMenu';

const { Header } = Layout;
const { useToken } = theme;

export default function TopMenuLayout() {
  const {
    token: { colorBgContainer, colorBorderSecondary }
  } = useToken();
  const menu = useMenu();
  return (
    <Layout className="site-layout">
      <Header
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          backgroundColor: colorBgContainer,
          borderBottom: `1px solid ${colorBorderSecondary}`
        }}
      >
        <Logo />
        <Menu
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none'
          }}
          mode="horizontal"
          theme="light"
          items={menu.items}
          selectedKeys={[menu.selectKey || '']}
          onClick={({ key, keyPath, domEvent }) => menu.onSelectKey(key)}
        />
        <HeaderActions />
      </Header>
      <Content />
      <Footer />
    </Layout>
  );
}
