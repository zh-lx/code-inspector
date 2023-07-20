import Icon from '@/components/Icons';
import React from 'react';
import classNames from 'classnames';
import styles from './index.module.css';

export type TrendProps = {
  flag: 'up' | 'down';
  style?: React.CSSProperties;
  reverseColor?: boolean;
  className?: string;
  children: string | React.ReactNode;
};

const Trend: React.FC<TrendProps> = ({
  reverseColor = false,
  flag,
  children,
  className,
  ...rest
}) => {
  const classString = classNames(
    styles.trendItem,
    {
      [styles.reverseColor]: reverseColor
    },
    className
  );
  return (
    <div
      {...rest}
      className={classString}
      title={typeof children === 'string' ? children : ''}
    >
      <span>{children}</span>
      {flag && (
        <span className={styles[flag]}>
          {flag === 'up' ? (
            <Icon type="CaretUpOutlined" />
          ) : (
            <Icon type="CaretDownOutlined" />
          )}
        </span>
      )}
    </div>
  );
};

export default Trend;
