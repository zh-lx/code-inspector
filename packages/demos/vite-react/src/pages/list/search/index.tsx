import React from 'react';
import {
  Card,
  Tag,
  Row,
  Col,
  theme,
  List,
  Button,
  Typography,
  Avatar
} from 'antd';
import { ProForm, ProFormSelect } from '@ant-design/pro-components';
import { TagMultiSelect } from '@/components/FormItems/TagSelect';
import Icon from '@/components/Icons';
import { useInfiniteScroll } from 'ahooks';
import { fetchArticleList } from '@/services/api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { useToken } = theme;

const PAGE_SIZE = 4;

export default function SearchList() {
  const [form] = ProForm.useForm();
  const { token } = useToken();
  const { data, loading, loadMore, loadingMore, reload } = useInfiniteScroll(
    async (d) => {
      const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
      const filterValues = form.getFieldsValue();
      const data = await fetchArticleList({
        PageSize: PAGE_SIZE,
        PageNumber: page,
        ...filterValues
      });
      return {
        list: data,
        total: 20
      };
    }
  );
  const hasMore = data && data.list.length < data.total;

  return (
    <>
      <Card bordered={false}>
        <ProForm
          disabled={loading}
          submitter={false}
          form={form}
          layout="horizontal"
          initialValues={{
            types: ['2', '3', '4', '12', '13'],
            owner: ['2', '3']
          }}
          onValuesChange={reload}
        >
          <ProForm.Item name="types" label="所有类型">
            <TagMultiSelect
              disabled={loading}
              items={[
                { label: '类型一', value: '1' },
                { label: '类型二', value: '2' },
                { label: '类型三', value: '3' },
                { label: '类型四', value: '4' },
                { label: '类型五', value: '5' },
                { label: '类型六', value: '6' },
                { label: '类型七', value: '7' },
                { label: '类型八', value: '8' },
                { label: '类型九', value: '9' },
                { label: '类型十', value: '10' },
                { label: '类型十一', value: '11' },
                { label: '类型十二', value: '12' },
                { label: '类型十三', value: '13' },
                { label: '类型十四', value: '14' },
                { label: '类型十五', value: '15' }
              ]}
            />
          </ProForm.Item>
          <Row
            gutter={20}
            align="middle"
            style={{ marginBottom: token.controlHeightSM }}
          >
            <Col>
              <ProFormSelect
                label="owner"
                name="owner"
                mode="multiple"
                formItemProps={{
                  style: { minWidth: '10rem', marginBottom: 0 }
                }}
                options={[
                  { label: '我自己', value: '1' },
                  { label: '吴家豪', value: '2' },
                  { label: '周星星', value: '3' },
                  { label: '赵丽颖', value: '4' },
                  { label: '姚明', value: '5' },
                  { label: '张三', value: '6' },
                  { label: '李四', value: '7' }
                ]}
              />
            </Col>
            <Col>
              <a
                onClick={() => {
                  form.setFieldsValue({ owner: ['1'] });
                }}
              >
                只看自己的
              </a>
            </Col>
          </Row>
          <Row
            gutter={20}
            style={{ marginBottom: `-${token.controlHeightSM}px` }}
          >
            <Col>
              <ProFormSelect
                placeholder="不限"
                label="活跃用户"
                name="activeuser"
                options={[{ label: '张三', value: 'zhangsan' }]}
              />
            </Col>
            <Col>
              <ProFormSelect
                placeholder="不限"
                label="好评度"
                name="praise"
                options={[{ label: '优秀', value: 'ok' }]}
              />
            </Col>
          </Row>
        </ProForm>
      </Card>
      <Card bordered={false} style={{ marginTop: 16 }}>
        <ArticleList
          data={data?.list}
          loading={loading}
          loadMore={loadMore}
          loadingMore={loadingMore}
          hasMore={hasMore}
        />
      </Card>
    </>
  );
}

const IconText: React.FC<{
  type: string;
  text: React.ReactNode;
}> = ({ type, text }) => {
  switch (type) {
    case 'star-o':
      return (
        <span>
          <Icon type="StarOutlined" style={{ marginRight: 8 }} />
          {text}
        </span>
      );
    case 'like-o':
      return (
        <span>
          <Icon type="LikeOutlined" style={{ marginRight: 8 }} />
          {text}
        </span>
      );
    case 'message':
      return (
        <span>
          <Icon type="MessageOutlined" style={{ marginRight: 8 }} />
          {text}
        </span>
      );
    default:
      return null;
  }
};

function ArticleList({
  loading,
  data = [],
  loadMore,
  loadingMore,
  hasMore
}: any) {
  const loadMoreDom = hasMore ? (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <Button onClick={loadMore} style={{ paddingLeft: 48, paddingRight: 48 }}>
        {loadingMore ? (
          <span>
            <Icon type="LoadingOutlined" /> 加载中...
          </span>
        ) : (
          '加载更多'
        )}
      </Button>
    </div>
  ) : (
    <span>No more data</span>
  );
  return (
    <List<any>
      size="large"
      loading={loading}
      rowKey="id"
      itemLayout="vertical"
      loadMore={loadMoreDom}
      dataSource={data}
      renderItem={(item) => (
        <List.Item
          key={item.id}
          actions={[
            <IconText key="star" type="star-o" text={item.star} />,
            <IconText key="like" type="like-o" text={item.like} />,
            <IconText key="message" type="message" text={item.message} />
          ]}
          extra={<div style={{ width: 272, height: 1 }} />}
        >
          <List.Item.Meta
            title={<a href={item.href}>{item.title}</a>}
            description={
              <span>
                <Tag>Ant Design</Tag>
                <Tag>设计语言</Tag>
                <Tag>蚂蚁金服</Tag>
              </span>
            }
          />
          <Text>{item.content}</Text>
          <Row gutter={20} style={{ paddingTop: '16px' }}>
            <Col>
              <Avatar src={item.avatar} size="small" />
              <a href={item.href} style={{ paddingLeft: 10 }}>
                {item.owner}
              </a>
            </Col>
            <Col>
              发布在 <a href={item.href}>{item.href}</a>
            </Col>
            <Col>
              <em>{dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}</em>
            </Col>
          </Row>
        </List.Item>
      )}
    />
  );
}
