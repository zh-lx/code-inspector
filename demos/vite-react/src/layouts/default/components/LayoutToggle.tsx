import React from 'react';
import { theme, Space } from 'antd';
import Icons from '@/components/Icons';
import { useDispatch, useSelector } from 'react-redux';
import { selectLayoutMode, setLayoutMode } from '@/store/reducer/layoutSlice';

const { useToken } = theme;

export default function LayoutToggle() {
  const dispatch = useDispatch();
  const layoutMode = useSelector(selectLayoutMode);
  return (
    <Space>
      <LayoutShapeItem
        side={{ bgColor: '#333', z: 2 }}
        top={{ bgColor: '#fff', z: 1 }}
        isSelected={layoutMode === 'sidemenu'}
        onSelected={() => dispatch(setLayoutMode('sidemenu'))}
      />
      <LayoutShapeItem
        isSelected={layoutMode === 'topmenu'}
        onSelected={() => dispatch(setLayoutMode('topmenu'))}
        side={false}
        top={{ bgColor: '#333', z: 2 }}
      />
    </Space>
  );
}

interface LayoutShapeItemProps {
  side: false | { bgColor: string; z: number };
  top: false | { bgColor: string; z: number };
  isSelected: boolean;
  onSelected: () => void;
}

function LayoutShapeItem({
  side,
  top,
  isSelected = false,
  onSelected
}: LayoutShapeItemProps) {
  const {
    token: { colorBorder, boxShadow }
  } = useToken();
  const w = 58;
  const h = 48;
  return (
    <div
      onClick={onSelected}
      style={{
        cursor: 'pointer',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0f2f5',
        width: w,
        height: h,
        border: `1px solid ${colorBorder}`,
        boxShadow: boxShadow
      }}
    >
      {side && (
        <span
          style={{
            position: 'absolute',
            width: 18,
            height: h,
            backgroundColor: side.bgColor,
            zIndex: side.z
          }}
        />
      )}
      {top && (
        <span
          style={{
            position: 'absolute',
            width: w,
            height: 10,
            backgroundColor: top.bgColor,
            zIndex: top.z
          }}
        />
      )}
      <SelectedCornerMark isSelected={isSelected} />
    </div>
  );
}

function SelectedCornerMark({
  isSelected = false
}: {
  isSelected: LayoutShapeItemProps['isSelected'];
}) {
  const {
    token: { colorPrimary }
  } = useToken();
  if (!isSelected) return null;
  return (
    <span
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 24,
        height: 24,
        backgroundImage: `linear-gradient(-45deg, ${colorPrimary} 50%, rgba(255, 255, 255, 0) 50%)`
      }}
    >
      <Icons
        type="CheckOutlined"
        style={{
          fontSize: 12,
          color: '#fff',
          position: 'absolute',
          bottom: 2,
          right: 1
        }}
      />
    </span>
  );
}
