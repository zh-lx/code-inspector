import Icons from '@/components/Icons';
import { Button, Card, Result, Typography } from 'antd';

const Content = (
  <>
    <div
      style={{
        marginBottom: 16,
        fontWeight: 500,
        fontSize: 16
      }}
    >
      <Typography.Text>您提交的内容有如下错误：</Typography.Text>
    </div>
    <Typography.Text style={{ marginBottom: 16, display: 'block' }}>
      <Typography.Text type="danger">
        <Icons type="CloseCircleOutlined" />
      </Typography.Text>
      <span style={{ paddingLeft: 8 }}>您的账户已被冻结</span>
      <a style={{ marginLeft: 16 }}>
        <span>立即解冻</span>
        <Icons type="RightOutlined" />
      </a>
    </Typography.Text>
    <Typography.Text>
      <Typography.Text type="danger">
        <Icons type="CloseCircleOutlined" />
      </Typography.Text>
      <span style={{ paddingLeft: 8 }}>您的账户还不具备申请资格</span>
      <a style={{ marginLeft: 16 }}>
        <span>立即升级</span>
        <Icons type="RightOutlined" />
      </a>
    </Typography.Text>
  </>
);

export default function Fail() {
  return (
    <Card bordered={false} style={{ flex: 1 }}>
      <Result
        status="error"
        title="提交失败"
        subTitle="请核对并修改以下信息后，再重新提交。"
        extra={
          <Button type="primary">
            <span>返回修改</span>
          </Button>
        }
        style={{ marginTop: 48, marginBottom: 16 }}
      >
        {Content}
      </Result>
    </Card>
  );
}
