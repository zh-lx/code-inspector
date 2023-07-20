import React from 'react';
import { Tooltip, Button } from 'antd';
import Icon from '@/components/Icons';
import { useFullscreen } from 'ahooks';

export function FullScreenHeaderButton() {
  const [isFullscreen, { toggleFullscreen }] = useFullscreen(() =>
    document.querySelector('html')
  );
  return (
    <Tooltip
      placement="bottom"
      title={isFullscreen ? '退出全屏' : '进入全屏'}
      arrow
    >
      <Button
        type="text"
        icon={React.createElement(
          !isFullscreen ? Icon.FullscreenOutlined : Icon.FullscreenExitOutlined
        )}
        onClick={toggleFullscreen}
      />
    </Tooltip>
  );
}
