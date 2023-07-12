import IntroduceRow from './components/IntroduceRow';
import { fetchAnalysisChart } from '@/services/api';
import { useRequest } from 'ahooks';
import SalesCard from './components/SalesCard';
import Ranking from './components/Ranking';
import BottomCards from './components/BottomCards';
import { Row, Col } from 'antd';

export default function Analysis() {
  const { loading, data = {} } = useRequest(fetchAnalysisChart);

  return (
    <>
      <IntroduceRow loading={loading} visitData={data.visitData || []} />
      <Row gutter={16}>
        <Col span={16}>
          <SalesCard loading={loading} data={data?.salesData || []} />
        </Col>
        <Col span={8}>
          <Ranking loading={loading} data={Array.from({ length: 18 })} />
        </Col>
      </Row>
      <BottomCards loading={loading} />
    </>
  );
}
