import React from 'react';
import { Card, theme } from 'antd';
import type { CardProps } from 'antd/es/card';
import classNames from 'classnames';
import styles from './index.module.css';

type totalType = () => React.ReactNode;

const { useToken } = theme;

const renderTotal = (total?: number | totalType | React.ReactNode) => {
  if (!total && total !== 0) {
    return null;
  }
  let totalDom;
  switch (typeof total) {
    case 'undefined':
      totalDom = null;
      break;
    case 'function':
      totalDom = <div className={styles.total}>{total()}</div>;
      break;
    default:
      totalDom = <div className={styles.total}>{total}</div>;
  }
  return totalDom;
};

export type ChartCardProps = {
  title: React.ReactNode;
  action?: React.ReactNode;
  total?: React.ReactNode | number | (() => React.ReactNode | number);
  footer?: React.ReactNode;
  contentHeight?: number;
  avatar?: React.ReactNode;
  style?: React.CSSProperties;
} & CardProps;

export default function ChartCard({
  loading = false,
  contentHeight,
  title,
  avatar,
  action,
  total,
  footer,
  children,
  ...rest
}: ChartCardProps) {
  const { token } = useToken();
  const renderContent = () => {
    if (loading) {
      return false;
    }
    return (
      <div className={styles.chartCard}>
        <div
          className={classNames(styles.chartTop, {
            [styles.chartTopMargin]: !children && !footer
          })}
        >
          <div className={styles.avatar}>{avatar}</div>
          <div className={styles.metaWrap}>
            <div
              className={styles.meta}
              style={{
                color: token.colorTextSecondary,
                fontSize: token.fontSize
              }}
            >
              <span className={styles.title}>{title}</span>
              <span className={styles.action}>{action}</span>
            </div>
            {renderTotal(total)}
          </div>
        </div>
        {children && (
          <div
            className={styles.content}
            style={{ height: contentHeight || 'auto' }}
          >
            <div className={contentHeight ? styles.contentFixed : ''}>
              {children}
            </div>
          </div>
        )}
        {footer && (
          <div
            className={classNames(styles.footer, {
              [styles.footerMargin]: !children
            })}
          >
            {footer}
          </div>
        )}
      </div>
    );
  };
  return (
    <Card
      loading={loading}
      bodyStyle={{ padding: '20px 24px 8px 24px' }}
      {...rest}
    >
      {renderContent()}
    </Card>
  );
}
