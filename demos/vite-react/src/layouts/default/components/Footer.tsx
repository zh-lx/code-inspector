import React from 'react';
import Icon from '@/components/Icons';
import { DefaultFooter } from '@ant-design/pro-components';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      className="site-footer"
      copyright={false}
      links={[
        {
          key: 'source-code',
          title: 'Source Code',
          href: 'https://github.com/strivelen/fine-admin',
          blankTarget: true
        },
        {
          key: 'github',
          title: <Icon type="GithubOutlined" />,
          href: 'https://github.com/strivelen',
          blankTarget: true
        },
        {
          key: 'Preview',
          title: 'Preview',
          href: 'https://strivelen.github.io/fine-admin/',
          blankTarget: true
        }
      ]}
    />
  );
};

export default Footer;
