import { IconType } from '@/components/Icons';

export interface MenuItem {
  label: string;
  key: string;
  icon?: IconType;
  children?: MenuItem[];
}

export const menus: MenuItem[] = [
  {
    label: 'Dashboard',
    key: '/',
    icon: 'DashboardOutlined'
  },
  {
    label: '表单页',
    key: 'form',
    icon: 'FormOutlined',
    children: [
      {
        label: '基础表单',
        key: '/form/basic-form'
      },
      {
        label: '分布表单',
        key: '/form/step-form'
      }
    ]
  },
  {
    label: '列表页',
    key: 'list',
    icon: 'TableOutlined',
    children: [
      {
        label: '搜索列表',
        key: '/list/search'
      },
      {
        label: '查询列表',
        key: '/list/table-list'
      }
    ]
  },
  {
    label: '详情页',
    key: 'profile',
    icon: 'ProfileOutlined',
    children: [
      {
        label: '基础详情页',
        key: '/profile/basic'
      },
      {
        label: '高级详情页',
        key: '/profile/advanced'
      }
    ]
  },
  {
    label: '结果页',
    key: 'result',
    icon: 'CheckCircleOutlined',
    children: [
      {
        label: '成功页',
        key: '/result/success'
      },
      {
        label: '失败页',
        key: '/result/fail'
      }
    ]
  },
  {
    label: '系统设置',
    key: 'setting',
    icon: 'SettingOutlined',
    children: [
      {
        label: '我的信息',
        key: '/settings/my-info'
      },
      {
        label: '修改密码',
        key: '/settings/change-password'
      }
    ]
  },
  {
    label: '多级菜单',
    key: 'more-level-menu',
    icon: 'UnorderedListOutlined',
    children: [
      {
        label: '二级菜单',
        key: 'two-level',
        children: [
          {
            label: '三级菜单',
            key: 'three-level',
            icon: 'SettingOutlined',
            children: [
              {
                label: '四级菜单',
                key: '/test'
              }
            ]
          }
        ]
      }
    ]
  }
];
