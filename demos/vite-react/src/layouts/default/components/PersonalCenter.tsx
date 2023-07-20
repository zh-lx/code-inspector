import Icon from '@/components/Icons';
import { Dropdown, Row, Col, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { persistor } from '@/store';
import { selectUserInfo } from '@/store/reducer/userSlice';
import { useAppSelector } from '@/hooks/useAppHooks';
import { useNavigate } from 'react-router-dom';

const enum PersonalCenterMenuKeys {
  MyInfo = 'MYINFO',
  ModifyPassword = 'MODIFYPASSWORD',
  Logout = 'LOGOUT'
}

export default function PersonalCenterEntry() {
  const navigate = useNavigate();
  const items: MenuProps['items'] = [
    {
      key: PersonalCenterMenuKeys.MyInfo,
      label: '我的信息',
      icon: <Icon type="IdcardOutlined" />
    },
    {
      key: PersonalCenterMenuKeys.ModifyPassword,
      label: '修改密码',
      icon: <Icon type="FormOutlined" />
    },
    { type: 'divider' },
    {
      key: PersonalCenterMenuKeys.Logout,
      danger: true,
      label: '退出登录',
      icon: <Icon type="PoweroffOutlined" />
    }
  ];
  const userInfo = useAppSelector(selectUserInfo);
  return (
    <Dropdown
      trigger={['hover']}
      menu={{
        items,
        style: { width: 110 },
        onClick: (e) => {
          switch (e.key) {
            case PersonalCenterMenuKeys.MyInfo:
              navigate('/settings/my-info');
              break;
            case PersonalCenterMenuKeys.ModifyPassword:
              navigate('/settings/change-password');
              break;
            case PersonalCenterMenuKeys.Logout:
              persistor.purge(); // 清楚硬盘（如：localStorage）中的所有数据
              break;
          }
        }
      }}
    >
      <Row
        gutter={10}
        style={{
          cursor: 'pointer',
          marginTop: -2,
          userSelect: 'none',
          padding: '0 10px'
        }}
      >
        <Col>
          <Avatar size="default" icon={<Icon type="UserOutlined" />} />
        </Col>
        <Col>{userInfo.Name || 'Admin'}</Col>
      </Row>
    </Dropdown>
  );
}
