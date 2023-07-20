import React from 'react';
import { theme } from 'antd';
const { useToken } = theme;

const fieldStyle: React.CSSProperties = {
  margin: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: '22px'
};

const numberStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: '22px',
  marginLeft: 8
};

interface FieldProps {
  label: string;
  value: string | React.ReactNode;
  style?: React.CSSProperties;
}

export default function Field({ label, value, ...rest }: FieldProps) {
  const { token } = useToken();
  return (
    <div style={fieldStyle} {...rest}>
      <span style={labelStyle}>{label}</span>
      <span style={{ ...numberStyle, color: token.colorTextHeading }}>
        {value}
      </span>
    </div>
  );
}
