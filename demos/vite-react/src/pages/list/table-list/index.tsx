import { Input, Button, theme, Form, Modal } from 'antd';
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormSelect,
  ProTable
} from '@ant-design/pro-components';
import Icon from '@/components/Icons';
import { getRules } from '@/services/api';
import styled from 'styled-components';
import config from '@/config';

const { useToken } = theme;

const getDataSource = async (params: any, sort: any, filter: any) => {
  const fetchParams = {
    ...params,
    pageNumber: params.current,
    isASC: Object.values(sort)[0] === 'ascend', // 是否是升序
    name: Object.keys(sort)[0] || 'ID' // 排序字段
  };
  delete fetchParams.current;
  const { List, VirtualCount } = await getRules(fetchParams);
  return {
    data: List,
    success: true,
    total: VirtualCount
  };
};

const columns: ProColumns<API.RuleItem>[] = [
  {
    title: '规则名称',
    dataIndex: 'name',
    tip: '规则名称是唯一的 key'
    // tooltip: '123'
  },
  {
    title: '描述',
    dataIndex: 'desc',
    valueType: 'textarea'
  },
  {
    title: '服务调用次数',
    dataIndex: 'callNo',
    sorter: true,
    hideInForm: true,
    renderText: (val: string) => `${val}万`
  },
  {
    title: '状态',
    dataIndex: 'status',
    hideInForm: true,
    valueEnum: {
      0: {
        text: '关闭',
        status: 'Default'
      },
      1: {
        text: '运行中',
        status: 'Processing'
      },
      2: {
        text: '已上线',
        status: 'Success'
      },
      3: {
        text: '异常',
        status: 'Error'
      }
    }
  },
  {
    title: '上次调度时间',
    sorter: true,
    dataIndex: 'updatedAt',
    valueType: 'dateTime',
    renderFormItem: (item, { defaultRender, ...rest }, form) => {
      const status = form.getFieldValue('status');

      if (`${status}` === '0') {
        return false;
      }

      if (`${status}` === '3') {
        return <Input {...rest} placeholder="请输入异常原因！" />;
      }

      return defaultRender(item);
    }
  },
  {
    title: '操作',
    dataIndex: 'option',
    valueType: 'option',
    render: (_, record) => [
      <a key="config">配置</a>,
      <a key="subscribeAlert" href="https://procomponents.ant.design/">
        订阅警报
      </a>
    ]
  }
];

const CustomProTableTheme = styled.div`
  .ant-pro-table-search,
  .ant-pro-card {
    background-color: ${(props) => props.theme.bg};
  }
  .ant-pro-table-list-toolbar-title,
  .ant-pro-table-list-toolbar-setting-item {
    color: ${(props) => props.theme.textColor};
  }
`;

export default function TableList() {
  const { token } = useToken();
  const actionRef = useRef<ActionType>();
  const [modal, contextHolder] = Modal.useModal();
  return (
    <CustomProTableTheme
      theme={{
        bg: token.colorBgContainer,
        textColor: token.colorText
      }}
    >
      <ProTable
        columns={columns}
        headerTitle="查询表格"
        actionRef={actionRef}
        rowKey="key"
        cardBordered
        search={{
          labelWidth: 120
        }}
        pagination={{
          defaultPageSize: config.pageSize
        }}
        toolBarRender={() => [
          <Button
            key="down_pdf"
            type="primary"
            icon={<Icon type="DownloadOutlined" />}
            onClick={() => {
              modal.warning({
                centered: true,
                title: '请自行添加事件'
              });
            }}
          >
            导出PDF
          </Button>,
          <AddRule key="add_rule" />
        ]}
        request={getDataSource}
      />
      {contextHolder}
    </CustomProTableTheme>
  );
}

function AddRule() {
  const [form] = Form.useForm<{ name: string; company: string }>();
  return (
    <ModalForm
      layout="horizontal"
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 19 }}
      grid={false}
      rowProps={{ gutter: 16 }}
      title="新增"
      form={form}
      modalProps={{ title: '新增规则', destroyOnClose: true, width: 560 }}
      trigger={
        <Button type="primary">
          <Icon type="PlusOutlined" />
          新建
        </Button>
      }
      submitTimeout={2000}
      // submitter={}
      onFinish={async (values) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log(values);
        return true;
      }}
    >
      <ProFormText
        width="md"
        label="规则名称"
        name="name"
        colProps={{ span: 16 }}
        rules={[
          {
            required: true,
            message: '请输入规则名称'
          }
        ]}
        placeholder="请输入规则名称"
      />
      <ProFormDigit
        label="调用次数"
        name="callNo"
        rules={[
          {
            required: true,
            message: '请输入调用次数'
          }
        ]}
        placeholder="请输入调用次数"
        addonAfter="万次"
      />
      <ProFormSelect
        width="sm"
        colProps={{ span: 12 }}
        label="状态"
        name="status"
        placeholder="请输入描述信息"
        options={[{ label: '进行中', value: '1' }]}
        rules={[
          {
            required: true,
            message: '请选择状态'
          }
        ]}
      />
      <ProFormTextArea
        colProps={{ span: 24 }}
        label="描述"
        name="desc"
        placeholder="请输入描述信息"
      />
    </ModalForm>
  );
}
