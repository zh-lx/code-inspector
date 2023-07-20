import React from 'react';
import {
  Descriptions,
  Typography,
  Card,
  Statistic,
  Dropdown,
  Button,
  Space,
  Row,
  Col,
  Steps,
  Popover,
  Badge,
  Tooltip,
  Table
} from 'antd';
import { RouteContext, PageHeader } from '@ant-design/pro-components';
import styled from 'styled-components';
import Icon from '@/components/Icons';
const { Title } = Typography;
const Step = Steps.Step;

const description = (
  <RouteContext.Consumer>
    {({ isMobile }) => (
      <Descriptions size="small" column={isMobile ? 1 : 2}>
        <Descriptions.Item label="创建人">曲丽丽</Descriptions.Item>
        <Descriptions.Item label="订购产品">XX 服务</Descriptions.Item>
        <Descriptions.Item label="创建时间">2017-07-07</Descriptions.Item>
        <Descriptions.Item label="关联单据">
          <a>12421</a>
        </Descriptions.Item>
        <Descriptions.Item label="生效日期">
          2017-07-07 ~ 2017-08-08
        </Descriptions.Item>
        <Descriptions.Item label="备注">请于两个工作日内确认</Descriptions.Item>
      </Descriptions>
    )}
  </RouteContext.Consumer>
);

const ExtraContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 200px;
`;
const extra = (
  <ExtraContainer>
    <Statistic title="状态" value="待审批" />
    <Statistic title="订单金额" value={568.08} prefix="¥" />
  </ExtraContainer>
);

const action = (
  <RouteContext.Consumer>
    {({ isMobile }) => {
      if (isMobile) {
        return (
          <Dropdown.Button
            type="primary"
            icon={<Icon type="DownOutlined" />}
            menu={{
              items: [
                { label: '操作一', key: 1 },
                { label: '操作二', key: 2 },
                { label: '选项一', key: 3 },
                { label: '选项二', key: 4 },
                { label: '选项三', key: 5 }
              ]
            }}
            placement="bottomRight"
          >
            主操作
          </Dropdown.Button>
        );
      }
      return (
        <Space size="middle">
          <Button.Group>
            <Button>操作一</Button>
            <Button>操作二</Button>
            <Dropdown
              menu={{
                items: [
                  { label: '选项一', key: 1 },
                  { label: '选项二', key: 2 }
                ]
              }}
              placement="bottomRight"
            >
              <Button icon={<Icon type="EllipsisOutlined" />} />
            </Dropdown>
          </Button.Group>
          <Button type="primary">主操作</Button>
        </Space>
      );
    }}
  </RouteContext.Consumer>
);

const popoverContent = (
  <div style={{ width: 160 }}>
    吴加号
    <span style={{ float: 'right' }}>
      <Badge
        status="default"
        text={<span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>未响应</span>}
      />
    </span>
    <div style={{ marginTop: 4 }}>耗时：2小时25分钟</div>
  </div>
);
const customDot = (dot: React.ReactNode, { status }: { status: string }) => {
  if (status === 'process') {
    return (
      <Popover placement="topLeft" arrow content={popoverContent}>
        <span>{dot}</span>
      </Popover>
    );
  }
  return dot;
};

export default function Advanced() {
  return (
    <>
      <Card
        bordered={false}
        style={{ marginInline: -16, marginTop: -16, borderRadius: 0 }}
      >
        <PageHeader
          style={{ padding: 0, paddingBottom: 20 }}
          title={
            <Title level={4} style={{ marginBottom: 0 }}>
              单号：234231029431
            </Title>
          }
          extra={action}
        />
        <Row wrap={false} gutter={30}>
          <Col>{description}</Col>
          <Col span={5}>{extra}</Col>
        </Row>
      </Card>
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%', padding: '30px 0' }}
      >
        <Card bordered={false} title="流程进度">
          <Steps direction="horizontal" progressDot={customDot} current={1}>
            <Step title="创建项目" description="吴丽丽" />
            <Step
              title="部门初审"
              description={
                <>
                  周毛毛
                  <a style={{ display: 'block' }} href="">
                    催一下
                  </a>
                </>
              }
            />
            <Step title="财务复核" />
            <Step title="完成" />
          </Steps>
        </Card>
        <Card bordered={false} title="用户信息">
          <Descriptions style={{ marginBottom: 24 }}>
            <Descriptions.Item label="用户姓名">付小小</Descriptions.Item>
            <Descriptions.Item label="会员卡号">
              32943898021309809423
            </Descriptions.Item>
            <Descriptions.Item label="身份证">
              3321944288191034921
            </Descriptions.Item>
            <Descriptions.Item label="联系方式">18112345678</Descriptions.Item>
            <Descriptions.Item label="联系地址">
              曲丽丽 18100000000 浙江省杭州市西湖区黄姑山路工专路交叉路口
            </Descriptions.Item>
          </Descriptions>
          <Descriptions style={{ marginBottom: 24 }} title="信息组">
            <Descriptions.Item label="某某数据">725</Descriptions.Item>
            <Descriptions.Item label="该数据更新时间">
              2017-08-08
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <span>
                  某某数据
                  <Tooltip title="数据说明">
                    <span style={{ marginLeft: 6 }}>
                      <Icon type="InfoCircleOutlined" />
                    </span>
                  </Tooltip>
                </span>
              }
            >
              725
            </Descriptions.Item>
            <Descriptions.Item label="该数据更新时间">
              2017-08-08
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Card
          bordered={false}
          tabList={[
            {
              key: 'tab1',
              tab: '操作日志一'
            },
            {
              key: 'tab2',
              tab: '操作日志二'
            },
            {
              key: 'tab3',
              tab: '操作日志三'
            }
          ]}
          onTabChange={(key) => console.log(key)}
        >
          <Table
            pagination={false}
            loading={false}
            dataSource={[
              {
                key: 'op1',
                type: '创建订单',
                name: '汗牙牙',
                status: 'agree',
                updatedAt: '2017-10-03 19:23:12',
                memo: '-'
              }
            ]}
            columns={[
              {
                title: '操作类型',
                dataIndex: 'type',
                key: 'type'
              },
              {
                title: '操作人',
                dataIndex: 'name',
                key: 'name'
              },
              {
                title: '执行结果',
                dataIndex: 'status',
                key: 'status',
                render: (text: string) => {
                  if (text === 'agree') {
                    return <Badge status="success" text="成功" />;
                  }
                  return <Badge status="error" text="驳回" />;
                }
              },
              {
                title: '操作时间',
                dataIndex: 'updatedAt',
                key: 'updatedAt'
              },
              {
                title: '备注',
                dataIndex: 'memo',
                key: 'memo'
              }
            ]}
          />
        </Card>
      </Space>
    </>
  );
}
