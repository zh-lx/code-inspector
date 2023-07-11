import React from 'react';
import { Layout, Menu, Row, Col, Space, theme, Button } from 'antd';
import Logo from './components/Logo';
import Header from './components/Header';
import useMenu from './useMenu';
import Icon from '@/components/Icons';
import { useDispatch, useSelector } from 'react-redux';
import { setCollapsed } from '@/store/reducer/layoutSlice';
import Breadcrumb from './components/Breadcrumb';
import HeaderActions from './components/HeaderActions';
import Content from './components/Content';
import Footer from './components/Footer';

const { Sider } = Layout;
const { useToken } = theme;

export default function SideMenuLayout() {
  const isDarkMode = useSelector(selectIsDarkMode);
  const {
    token: { colorBgContainer }
  } = useToken();
  const dispatch = useDispatch();
  const { collapsed } = useAppSelector((state) => state.layout);
  const menu = useMenu();
  return (
    <Layout hasSider>
      <Sider
        width={260}
        collapsedWidth={80}
        trigger={null}
        // collapsible
        collapsed={collapsed}
        style={{ backgroundColor: !isDarkMode ? colorBgContainer : undefined }}
      >
        <div
          style={{
            overflowY: 'auto',
            height: '100vh',
            position: 'sticky',
            top: 0
          }}
        >
          <Logo />
          <Menu
            mode="inline"
            theme={isDarkMode ? 'dark' : 'light'}
            items={menu.items}
            selectedKeys={[menu.selectKey || '']}
            onClick={({ key, keyPath, domEvent }) => menu.onSelectKey(key)}
            openKeys={menu.openKeys}
            onOpenChange={menu.onOpenKeys}
          />
        </div>
      </Sider>
      <Layout className="site-layout">
        <Header
          style={{
            height: 56,
            lineHeight: '56px'
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="text"
                  icon={React.createElement(
                    collapsed ? Icon.MenuUnfoldOutlined : Icon.MenuFoldOutlined
                  )}
                  onClick={() => dispatch(setCollapsed(!collapsed))}
                />
                <Breadcrumb />
              </Space>
            </Col>
            <Col>
              <HeaderActions />
            </Col>
          </Row>
        </Header>
        <Content />
        <Footer />
      </Layout>
    </Layout>
  );
}
