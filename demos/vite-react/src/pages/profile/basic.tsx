import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card, Descriptions, Divider, Table, Typography } from 'antd';
import { useAppDispatch } from '@/hooks/useAppHooks';
import { setBreadcrumb } from '@/store/reducer/layoutSlice';
import { ProTable } from '@ant-design/pro-components';

const dataSource = [
  {
    amount: '2.00',
    barcode: '12421432143214321',
    id: '1234561',
    name: '矿泉水 550ml',
    num: '1',
    price: '2.00'
  },
  {
    amount: '6.00',
    barcode: '12421432143214322',
    id: '1234562',
    name: '凉茶 300ml',
    num: '2',
    price: '3.00'
  },
  {
    amount: '28.00',
    barcode: '12421432143214323',
    id: '1234563',
    name: '好吃的薯片',
    num: '4',
    price: '7.00'
  },
  {
    amount: '25.50',
    barcode: '12421432143214324',
    id: '1234564',
    name: '特别好吃的蛋卷',
    num: '3',
    price: '8.50'
  }
];

export default function Basic() {
  const dispatch = useAppDispatch();

  const goodsColumns = [
    {
      title: '商品编号',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '商品条码',
      dataIndex: 'barcode',
      key: 'barcode'
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as 'left' | 'right' | 'center'
    },
    {
      title: '数量（件）',
      dataIndex: 'num',
      key: 'num',
      align: 'right' as 'left' | 'right' | 'center',
      render: (text: ReactNode, _: any, index: number) => {
        if (index < dataSource.length) {
          return text;
        }
        return <span style={{ fontWeight: 600 }}>{text}</span>;
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as 'left' | 'right' | 'center',
      render: (text: ReactNode, _: any, index: number) => {
        if (index < dataSource.length) {
          return text;
        }
        return <span style={{ fontWeight: 600 }}>{text}</span>;
      }
    }
  ];

  useEffect(() => {
    dispatch(
      setBreadcrumb([
        '详情页',
        { name: '小鸡炖蘑菇', path: '/profile/basic' },
        '第一锅'
      ])
    );
  }, []);
  return (
    <Card style={{ height: '100%' }} bordered={false}>
      <Descriptions title="退款申请" style={{ marginBottom: 32 }} column={4}>
        <Descriptions.Item label="取货单号">1000000000</Descriptions.Item>
        <Descriptions.Item label="状态">已取货</Descriptions.Item>
        <Descriptions.Item label="销售单号">1234123421</Descriptions.Item>
        <Descriptions.Item label="子订单">3214321432</Descriptions.Item>
      </Descriptions>
      <Divider style={{ marginBottom: 32 }} />
      <Descriptions
        title="用户信息"
        style={{ marginBottom: 32 }}
        colon
        column={1}
      >
        <Descriptions.Item label="用户姓名">付小小</Descriptions.Item>
        <Descriptions.Item label="联系电话">18100000000</Descriptions.Item>
        <Descriptions.Item label="常用快递">菜鸟仓储</Descriptions.Item>
        <Descriptions.Item label="取货地址">
          浙江省杭州市西湖区万塘路18号
        </Descriptions.Item>
        <Descriptions.Item label="备注">无</Descriptions.Item>
      </Descriptions>
      <Divider style={{ marginBottom: 32 }} />
      <Typography.Title level={5}>退货商品</Typography.Title>
      <ProTable
        style={{ marginBottom: 24 }}
        pagination={false}
        search={false}
        options={false}
        toolBarRender={false}
        dataSource={dataSource}
        columns={goodsColumns}
        rowKey="id"
        // eslint-disable-next-line react/no-unstable-nested-components
        summary={(data) => <Summary data={data} />}
      />
    </Card>
  );
}

function Summary({
  data
}: {
  data: readonly {
    amount: string;
    barcode: string;
    id: string;
    name: string;
    num: string;
    price: string;
  }[];
}) {
  return (
    <Table.Summary fixed="bottom">
      <Table.Summary.Row>
        <Table.Summary.Cell index={0} colSpan={4}>
          <strong>总计</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={5} align="right">
          <strong>10</strong>
        </Table.Summary.Cell>
        <Table.Summary.Cell index={6} align="right">
          <strong>61.5</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </Table.Summary>
  );
}
