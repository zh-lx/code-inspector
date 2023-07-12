import { Space } from 'antd';
import { FullScreenHeaderButton } from './FullScreen';
import NoticeHeaderButton from './NoticeIcon';
import PersonalCenter from './PersonalCenter';
import LocalSettingsHeaderButton from './LocalSettings';

export default function HeaderActions() {
  return (
    <Space>
      <FullScreenHeaderButton />
      <NoticeHeaderButton />
      <PersonalCenter />
      <LocalSettingsHeaderButton />
    </Space>
  );
}
