import { Link, useNavigate } from 'react-router-dom';
import { Button, Space, Input, Select, DatePicker } from 'antd';
import Icon from '@/components/Icons';
// import Loading from '@/components/Loading';

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      {/* <Loading /> */}
      <Space wrap>
        <Link to="/login">到登录页</Link>
        <DatePicker
        // onChange={(date, dateString) => {
        //   console.log(date, dateString);
        // }}
        />
        {/* <UserOutlined /> */}
        <Icon.UserOutlined />
        <Icon.BlockOutlined />
        <Input placeholder="你好" />
        <Select
          defaultValue="lucy"
          style={{ width: 120 }}
          options={[
            {
              value: 'jack',
              label: 'Jack'
            },
            {
              value: 'lucy',
              label: 'Lucy'
            },
            {
              value: 'disabled',
              disabled: true,
              label: 'Disabled'
            },
            {
              value: 'Yiminghe',
              label: 'yiminghe'
            }
          ]}
        />
        {/* <Button type="primary" onClick={() => setPrefixCls("light")}>明亮</Button> */}
        <Button type="primary" onClick={() => navigate('/non-menu')}>
          跳转至子页面
        </Button>
        <Button type="primary" onClick={() => navigate('/details')}>
          动态路由: /details
        </Button>
        <Button type="primary" onClick={() => navigate('/details/100')}>
          动态路由: /details/100
        </Button>
      </Space>
    </>
  );
}
