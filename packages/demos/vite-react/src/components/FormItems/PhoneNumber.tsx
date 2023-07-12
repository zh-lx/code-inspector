import { ProFormDigit, ProFormItemProps } from '@ant-design/pro-components';

export default function PhoneNumber({
  fieldProps,
  rules = [],
  ...props
}: ProFormItemProps) {
  return (
    <ProFormDigit
      fieldProps={{
        controls: false,
        maxLength: 13,
        precision: 0,
        formatter: (value, info) => {
          const str = String(value);
          if (str.length >= 3 && str.length < 7) {
            return str.replace(/^(\d{3})(\d{0,4})/, '$1 $2');
          }
          if (str.length >= 7 && str.length <= 11) {
            return str.replace(/^(\d{3})(\d{4})(\d{0,4})/g, '$1 $2 $3');
          }
          return str;
        },
        ...fieldProps
      }}
      placeholder="请输入手机号码"
      rules={[
        {
          required: true,
          message: '请输入手机号码'
        },
        {
          pattern: /^1(3|4|5|6|7|8|9)\d{9}/g,
          message: '请输入正确的手机号'
        },
        ...rules
      ]}
      {...props}
    />
  );
}
