import React from 'react';
import { Space, SpaceProps } from 'antd';
import DefaultTagItem from './DefaultTagItem';
import TagMultiSelect from './TagMultiSelect';
import type { TagMultiSelectProps } from './TagMultiSelect';
import type {
  DefaultTagItemProps,
  DefaultTagItemClick
} from './DefaultTagItem';

export type { DefaultTagItemProps, DefaultTagItemClick, TagMultiSelectProps };

export { TagMultiSelect, DefaultTagItem };

TagSelect.TagMultiSelect = TagMultiSelect;

TagSelect.DefaultTagItem = DefaultTagItem;

export interface RenderItemArgs extends Omit<DefaultTagItemProps, 'onClick'> {
  onClick: () => void;
}
type RenderItem = (arg: RenderItemArgs) => React.ReactNode;

export interface TagSelectProps {
  size?: SpaceProps['size'];
  renderItem?: RenderItem;
  disabled?: boolean;
  items?: Array<Pick<DefaultTagItemProps, 'label' | 'value'>>;
  value?: DefaultTagItemProps['value'];
  onChange?: DefaultTagItemClick;
}

export default function TagSelect({
  items = [],
  value,
  onChange,
  disabled,
  renderItem,
  size = 'small'
}: TagSelectProps) {
  return (
    <Space size={size} wrap>
      {items.map((item, index) => {
        if (renderItem && typeof renderItem === 'function') {
          return renderItem({
            disabled,
            isSelected: value === item.value,
            label: item.label,
            value: item.value,
            onClick: () => onChange?.(item.value, item)
          });
        }
        return (
          <DefaultTagItem
            disabled={disabled}
            key={index}
            isSelected={value === item.value}
            label={item.label}
            value={item.value}
            onClick={!disabled ? onChange : undefined}
          />
        );
      })}
    </Space>
  );
}
