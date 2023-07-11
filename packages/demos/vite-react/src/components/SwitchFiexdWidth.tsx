import { useDispatch, useSelector } from 'react-redux';
import { setIsFixedWidth } from '@/store/reducer/layoutSlice';
import { useUpdateEffect } from 'ahooks';
import { Switch } from 'antd';

export default function SwitchFiexdWidth() {
  const dispatch = useDispatch();
  const isFixedWidth = useSelector(selectIsFixedWidth);
  const layoutMode = useSelector(selectLayoutMode);
  const [checked, setChecked] = useState(isFixedWidth);

  useUpdateEffect(() => {
    setTimeout(() => {
      dispatch(setIsFixedWidth(checked));
    }, 120);
  }, [checked]);

  return (
    <Switch
      disabled={layoutMode !== 'topmenu'}
      defaultChecked={isFixedWidth}
      checked={checked}
      onChange={setChecked}
    />
  );
}
