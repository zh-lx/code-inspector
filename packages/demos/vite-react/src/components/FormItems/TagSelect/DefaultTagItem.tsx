import { Tag } from 'antd';
const { CheckableTag } = Tag;

export interface DefaultTagItemProps {
  label: string;
  value: string;
  disabled?: boolean;
  isSelected?: boolean;
  onClick?: DefaultTagItemClick;
}

export type DefaultTagItemClick = (
  v: DefaultTagItemProps['value'],
  option: Pick<DefaultTagItemProps, 'label' | 'value'>
) => void;

export default function DefaultTagItem({
  disabled,
  label,
  value,
  isSelected = false,
  onClick
}: DefaultTagItemProps) {
  if (disabled) {
    return isSelected ? (
      <CheckableTag key={value} checked={isSelected as boolean}>
        {label}
      </CheckableTag>
    ) : (
      <Tag key={value} style={{ border: 'none', paddingInline: 8 }}>
        {label}
      </Tag>
    );
  }
  return (
    <CheckableTag
      key={value}
      checked={isSelected}
      onChange={() => onClick?.(value, { label, value })}
    >
      {label}
    </CheckableTag>
  );
}
