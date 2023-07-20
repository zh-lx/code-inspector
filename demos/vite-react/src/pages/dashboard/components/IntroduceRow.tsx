import Icon from '@/components/Icons';
import { TinyArea, TinyColumn, Bullet } from '@ant-design/plots';
import { Col, Row, Tooltip } from 'antd';
import CountUp from 'react-countup';

import ChartCard from './ChartCard';
import Trend from './Trend';
import Field from './Field';

const topColResponsiveProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 12,
  xl: 6,
  style: { marginBottom: 16 }
};

const IntroduceRow = ({
  loading,
  visitData
}: {
  loading: boolean;
  visitData: any[];
}) => (
  <Row gutter={16}>
    <Col {...topColResponsiveProps}>
      <ChartCard
        bordered={false}
        title="总销售额"
        action={
          <Tooltip title="指标说明">
            <Icon type="InfoCircleOutlined" />
          </Tooltip>
        }
        loading={loading}
        total={<CountUp prefix="￥" separator="," end={126560} />}
        footer={
          <Field
            label="日销售额"
            value={<CountUp prefix="￥" separator="," end={12423} />}
          />
        }
        contentHeight={46}
      >
        <Trend flag="up" style={{ marginRight: 16 }}>
          周同比&nbsp;&nbsp;
          <span>12%</span>
        </Trend>
        <Trend flag="down">
          日同比&nbsp;&nbsp;
          <span>11%</span>
        </Trend>
      </ChartCard>
    </Col>
    <Col {...topColResponsiveProps}>
      <ChartCard
        bordered={false}
        loading={loading}
        title="访问量"
        action={
          <Tooltip title="指标说明">
            <Icon type="InfoCircleOutlined" />
          </Tooltip>
        }
        total={<CountUp prefix="￥" separator="," end={8846} />}
        footer={
          <Field
            label="日访问量"
            value={<CountUp prefix="￥" separator="," end={1234} />}
          />
        }
        contentHeight={46}
      >
        <TinyArea
          color="#975FE4"
          height={46}
          autoFit={true}
          smooth
          data={visitData.map((i) => i.y)}
          tooltip={{
            customContent: (x, data) => {
              return `日期：${visitData[Number(x)].x} 数量：${
                data[0]?.data?.y
              }`;
            }
          }}
        />
      </ChartCard>
    </Col>
    <Col {...topColResponsiveProps}>
      <ChartCard
        bordered={false}
        loading={loading}
        title="支付笔数"
        action={
          <Tooltip title="指标说明">
            <Icon type="InfoCircleOutlined" />
          </Tooltip>
        }
        total={<CountUp prefix="￥" separator="," end={6560} />}
        footer={
          <Field
            label="转化率"
            value={<CountUp suffix="%" end={60} duration={1} />}
          />
        }
        contentHeight={46}
      >
        <TinyColumn
          height={46}
          autoFit={true}
          data={visitData.map((i) => i.y)}
          tooltip={{
            customContent: (x, data) => {
              return `日期：${visitData[Number(x)].x} 数量：${
                data[0]?.data?.y
              }`;
            }
          }}
        />
      </ChartCard>
    </Col>
    <Col {...topColResponsiveProps}>
      <ChartCard
        loading={loading}
        bordered={false}
        title="运营活动效果"
        action={
          <Tooltip title="指标说明">
            <Icon type="InfoCircleOutlined" />
          </Tooltip>
        }
        total={<CountUp suffix="%" end={68} duration={1} />}
        footer={
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <Trend flag="up" style={{ marginRight: 16 }}>
              周同比&nbsp;&nbsp;
              <span>
                <CountUp suffix="%" end={12} duration={1} />
              </span>
            </Trend>
            <Trend flag="down">
              日同比&nbsp;&nbsp;
              <span>
                <CountUp suffix="%" end={11} duration={1} />
              </span>
            </Trend>
          </div>
        }
        contentHeight={46}
      >
        {/* <Progress
          height={46}
          percent={0.78}
          color="#13C2C2"
          autoFit={false}
          tooltip={{
            marker: [
              {
                value: 0.8,
                style: {
                  stroke: '#13C2C2'
                }
              }
            ]
          }}
        /> */}
        <Bullet
          data={[
            {
              title: '满意度',
              ranges: [100],
              measures: [68],
              target: 85
            }
          ]}
          height={20}
          autoFit={true}
          measureField="measures"
          rangeField="ranges"
          targetField="target"
          xField="title"
          xAxis={false}
          yAxis={false}
          tooltip={{
            showMarkers: false,
            shared: true
          }}
        />
      </ChartCard>
    </Col>
  </Row>
);

export default IntroduceRow;
