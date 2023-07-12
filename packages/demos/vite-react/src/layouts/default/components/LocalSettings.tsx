import { ReactNode, useState } from 'react';
import { Tooltip, Drawer, Button, Card, theme } from 'antd';
import Icon from '@/components/Icons';
import type { DrawerProps } from 'antd';
import { DarkModeSwitch } from '@/components/DarkModeSwitch';
import { ThemeColorsSelect } from '@/components/ThemeColors';
import SwitchFiexdWidth from '@/components/SwitchFiexdWidth';
import LayoutToggle from './LayoutToggle';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsOpenSetting,
  setIsOpenSetting
} from '@/store/reducer/layoutSlice';

const { useToken } = theme;

export default function LocalSettingsBtn() {
  const dispatch = useDispatch();
  return (
    <Tooltip placement="bottomRight" title="本地设置" arrow>
      <Button
        type="text"
        icon={<Icon type="SettingOutlined" />}
        onClick={() => dispatch(setIsOpenSetting(true))}
      />
    </Tooltip>
  );
}

export function LocalSettingsDrawer(props: DrawerProps) {
  const isOpenSetting = useSelector(selectIsOpenSetting);
  const dispatch = useDispatch();
  return (
    <Drawer
      bodyStyle={{ padding: '16px' }}
      title="系统本地设置"
      placement="right"
      open={isOpenSetting}
      onClose={() => dispatch(setIsOpenSetting(false))}
    >
      <ConfigItem title="整体风格" content={<DarkModeSwitch />} />
      <ConfigItem title="导航模式" content={<LayoutToggle />} />
      <ConfigItem title="主题色" content={<ThemeColorsSelect />} />
      <ConfigItem title="固定内容区域宽度" content={<SwitchFiexdWidth />} />
    </Drawer>
  );
}

function ConfigItem({
  title,
  content
}: {
  title: ReactNode | string;
  content: ReactNode;
}) {
  const {
    token: { boxShadow }
  } = useToken();
  return (
    <Card
      size="small"
      bordered={false}
      style={{
        width: '100%',
        marginBottom: 16,
        boxShadow
      }}
      bodyStyle={{ padding: '8px 16px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ margin: '8px 0', fontSize: 15 }}>{title}</div>
        {content}
      </div>
    </Card>
  );
}
