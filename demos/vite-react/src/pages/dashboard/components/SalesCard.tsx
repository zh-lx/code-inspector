import { Card, Tabs } from 'antd';
import { Column } from '@ant-design/plots';
import '../style.css';

interface SalesCardProps {
  loading: boolean;
  data: any[];
}

const tabBarStyle = { marginBottom: 24, padding: '0 16px' };

function SalesCard({ loading, data }: SalesCardProps) {
  return (
    <Card
      loading={loading}
      bordered={false}
      bodyStyle={{ padding: 0 }}
      className="analysis_salesCard"
      style={{ height: '100%' }}
    >
      <Tabs
        size="large"
        tabBarStyle={tabBarStyle}
        // tabBarExtraContent={<TabBarExtraContent />}
      >
        <Tabs.TabPane tab="销售额" key="sales">
          <Column
            height={300}
            autoFit
            data={data}
            xField="x"
            yField="y"
            xAxis={{
              title: {
                text: '2022年'
              }
            }}
            yAxis={{
              title: {
                text: '销售量'
              }
            }}
            meta={{
              y: {
                alias: '销售量'
              }
            }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="访问量" key="views">
          <Column
            height={300}
            autoFit
            data={data}
            xField="x"
            yField="y"
            xAxis={{
              title: {
                text: '2022年'
              }
            }}
            yAxis={{
              title: {
                text: '访问量'
              }
            }}
            meta={{
              y: {
                alias: '访问量'
              }
            }}
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  );
}


export default SalesCard;
