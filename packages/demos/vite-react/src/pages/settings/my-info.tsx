import { Row, Col, Card } from 'antd';
import {
  ProForm,
  ProFormText,
  ProFormTextArea
} from '@ant-design/pro-components';
import PhoneNumber from '@/components/FormItems/PhoneNumber';
import EmailInput from '@/components/FormItems/EmailInput';

export default function MyInfo() {
  const onFinish = async (values: { OldPassword: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(values);
  };
  return (
    <Card style={{ flex: 1 }} bordered={false}>
      <Row>
        <Col offset={1} xs={23} md={18} lg={16} xl={12} xxl={10}>
          <ProForm
            layout="vertical"
            onFinish={onFinish}
            submitter={{
              searchConfig: {
                submitText: '保存'
              },
              resetButtonProps: {
                style: {
                  display: 'none'
                }
              }
            }}
          >
            <ProFormText
              width="md"
              label="姓名"
              placeholder="请输入姓名"
              name="Name"
              rules={[
                {
                  required: true,
                  message: '请输入姓名'
                }
              ]}
            />
            <PhoneNumber width="sm" label="手机号码" name="Phone" />
            <EmailInput width="md" label="邮箱" name="Email" />
            <ProFormText
              label="所在城市"
              placeholder="请选择城市"
              name="City"
              rules={[
                {
                  required: true,
                  message: '请选择城市'
                }
              ]}
            />
            <ProFormTextArea
              label="详细地址"
              placeholder="请输入详细地址"
              name="Address"
              rules={[
                {
                  required: true,
                  message: '请输入详细地址'
                }
              ]}
            />
          </ProForm>
        </Col>
      </Row>
    </Card>
  );
}
