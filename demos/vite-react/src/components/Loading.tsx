import Icon from '@/components/Icons';
import { Spin, Row, Col } from 'antd';
import { selectIsDarkMode } from '@/store/reducer/layoutSlice';

const antIcon = <Icon type="LoadingOutlined" style={{ fontSize: 24 }} spin />;

interface LoadingParams {
  height?: string | number;
}

/**
 * 正在加载图标
 * @param {LoadingParams} param0
 * @returns
 */
export default function Loading({ height }: LoadingParams) {
  const isDarkMode = useAppSelector(selectIsDarkMode);
  return (
    <Row
      align="middle"
      justify="center"
      style={{
        flex: 1,
        height: height || '100vh',
        backgroundColor: isDarkMode ? '#000' : '#fff'
      }}
    >
      <Col>
        <Spin indicator={antIcon} tip="加载中..." />
      </Col>
    </Row>
  );
}
