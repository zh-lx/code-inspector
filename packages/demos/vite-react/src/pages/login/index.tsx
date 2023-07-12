import { FC, useState, createElement, ReactNode } from 'react';
import { Space, Form, theme } from 'antd';
import type { FormItemProps } from 'antd';
import { useAppDispatch } from '@/hooks/useAppHooks';
import { message } from '@/hooks/useGlobalTips';
import { login } from '@/store/reducer/userSlice';
import styles from './login.module.css';
import { useLocation, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import Icon from '@/components/Icons';
import { LoginForm } from '@ant-design/pro-components';
import LoginLogo from './components/LoginLogo';

const FormItem = Form.Item;
const { useToken } = theme;
const iconStyles = {
  marginInlineStart: '16px',
  fontSize: '24px',
  verticalAlign: 'middle',
  cursor: 'pointer'
};

interface Container {
  children: ReactNode;
}

const LoginContainer: FC<Container> = ({ children }) => {
  return (
    <div className={styles.login_bg}>
      <div className={styles.login_container}>{children}</div>
    </div>
  );
};

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const prev_page_location = location.state as typeof location;
  const dispatch = useAppDispatch();

  const onFinish: (formData: any) => Promise<boolean | void> = async (
    values
  ) => {
    await dispatch(
      login({ username: values.username, password: values.password })
    ).unwrap(); // return originalPromiseResult
    message.success('登录成功');
    navigate(
      prev_page_location
        ? prev_page_location.pathname + prev_page_location.search
        : '/'
    );
  };
  return (
    <LoginContainer>
      <div>
        <LoginForm
          title={<LoginLogo />}
          subTitle={
            <span className={styles.subtitle}>中后台管理系统通用模板</span>
          }
          initialValues={{
            username: 'admin',
            password: '123456'
          }}
          onFinish={onFinish}
          actions={<Actions />}
        >
          <UserName name="username" />
          <Password name="password" />
        </LoginForm>
      </div>
    </LoginContainer>
  );
}

interface LoginFormItem extends FormItemProps {
  prefix: ReactNode;
  children: ReactNode;
  suffix?: ReactNode;
}

const LoginFormItem: FC<LoginFormItem> = ({
  prefix,
  suffix,
  children,
  ...formItemProps
}) => {
  const { token } = useToken();
  return (
    <div className={styles.form_item_box}>
      {prefix}
      <FormItem {...formItemProps} className={styles.form_item}>
        {children}
      </FormItem>
      {suffix}
      <span className={styles.line}>
        <i
          style={{ borderBottomColor: token.colorPrimary }}
          className={styles.line_active}
        />
      </span>
    </div>
  );
};

function UserName(formItemProps: FormItemProps) {
  return (
    <LoginFormItem
      {...formItemProps}
      prefix={
        <Icon
          type="UserOutlined"
          className={classnames(styles.form_item_icon, styles.prefix)}
        />
      }
    >
      <input autoComplete="off" type="text" placeholder="请输入用户名" />
    </LoginFormItem>
  );
}

function Password(formItemProps: FormItemProps) {
  const [isLock, setLock] = useState(false);
  return (
    <LoginFormItem
      {...formItemProps}
      prefix={
        <Icon
          type="LockOutlined"
          className={classnames(styles.form_item_icon, styles.prefix)}
        />
      }
      suffix={createElement(
        isLock ? Icon.EyeOutlined : Icon.EyeInvisibleOutlined,
        {
          className: classnames(styles.form_item_icon, styles.suffix),
          onClick: () => setLock((preState) => !preState)
        }
      )}
    >
      <input
        type={isLock ? 'text' : 'password'}
        placeholder="请输入密码"
        name="password"
      />
    </LoginFormItem>
  );
}

function Actions() {
  return (
    <Space>
      其他登录方式
      <Icon
        type="AlipayCircleFilled"
        style={{ ...iconStyles, color: '#1976ff' }}
      />
      <Icon
        type="TaobaoCircleOutlined"
        style={{ ...iconStyles, color: '#eb602d' }}
      />
      <Icon
        type="WeiboCircleOutlined"
        style={{ ...iconStyles, color: '#f10000' }}
      />
    </Space>
  );
}
