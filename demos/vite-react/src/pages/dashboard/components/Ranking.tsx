import React from 'react';
import { Card } from 'antd';
import CountUp from 'react-countup';

import '../style.css';

interface RankingItemProps {
  rankNumber: number;
  title: string;
  value: number;
}

export default function Ranking({
  loading,
  data = []
}: {
  loading: boolean;
  data: RankingItemProps[];
}) {
  return (
    <Card
      loading={loading}
      bordered={false}
      title="XX排名"
      headStyle={{ fontWeight: 400 }}
      bodyStyle={{
        paddingBlock: 0,
        marginTop: 16,
        paddingBottom: 10,
        maxHeight: 320,
        overflowY: 'auto'
      }}
      style={{ height: '100%' }}
    >
      {data.map((item, index) => (
        <RankingItem
          key={index}
          rankNumber={index + 1}
          title={`某某某 ${index + 1} 号店`}
          value={123456}
        />
      ))}
    </Card>
  );
}

const ranking_item: React.CSSProperties = {
  padding: '6px 0',
  display: 'flex',
  justifyContent: 'space-between'
};
const ranking_item_number: React.CSSProperties = {
  display: 'inline-block',
  width: 20,
  height: 20,
  borderRadius: '50%',
  textAlign: 'center',
  lineHeight: '20px',
  marginRight: 10,
  fontSize: 12
};
const ranking_item_title: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6
};
const ranking_item_value: React.CSSProperties = {};

function RankingItem({ rankNumber, title, value }: RankingItemProps) {
  return (
    <div style={ranking_item}>
      <div>
        <span
          style={{
            ...ranking_item_number,
            backgroundColor: rankNumber < 4 ? '#314659' : undefined,
            color: rankNumber < 4 ? '#fff' : undefined
          }}
        >
          {rankNumber}
        </span>
        <span style={ranking_item_title}>{title}</span>
      </div>
      <CountUp separator="," delay={0} end={value}>
        {({ countUpRef }) => (
          <span ref={countUpRef} style={ranking_item_value} />
        )}
      </CountUp>
    </div>
  );
}
