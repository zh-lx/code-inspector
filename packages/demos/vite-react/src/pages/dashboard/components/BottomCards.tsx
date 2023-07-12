import React from 'react';
import { Card, Row, Col } from 'antd';
import { Pie, measureTextWidth, RadialBar, WordCloud } from '@ant-design/plots';
import type {
  PieConfig,
  RadialBarConfig,
  WordCloudConfig
} from '@ant-design/plots';

interface BottomCardsProps {
  loading: boolean;
}

export default function BottomCards({ loading }: BottomCardsProps) {
  const cardHeadStyle: React.CSSProperties = {
    fontWeight: 400
  };
  function renderStatistic(
    containerWidth: number,
    text: string,
    style: React.CSSProperties
  ) {
    const { width: textWidth, height: textHeight } = measureTextWidth(
      text,
      style
    );
    const R = containerWidth / 2; // r^2 = (w / 2)^2 + (h - offsetY)^2

    let scale = 1;

    if (containerWidth < textWidth) {
      scale = Math.min(
        Math.sqrt(
          Math.abs(
            Math.pow(R, 2) /
              (Math.pow(textWidth / 2, 2) + Math.pow(textHeight, 2))
          )
        ),
        1
      );
    }

    const textStyleStr = `width:${containerWidth}px;`;
    return `<div style="${textStyleStr};font-size:${scale}em;line-height:${
      scale < 1 ? 1 : 'inherit'
    };">${text}</div>`;
  }
  const configPie: PieConfig = {
    appendPadding: 10,
    data: [
      {
        type: '分类一',
        value: 27
      },
      {
        type: '分类二',
        value: 25
      },
      {
        type: '分类三',
        value: 18
      },
      {
        type: '分类四',
        value: 15
      },
      {
        type: '分类五',
        value: 10
      },
      {
        type: '其他',
        value: 5
      }
    ],
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    innerRadius: 0.64,
    meta: {
      value: {
        formatter: (v) => `${v} ¥`
      }
    },
    label: {
      type: 'inner',
      offset: '-50%',
      style: {
        textAlign: 'center'
      },
      autoRotate: false,
      content: '{value}'
    },
    statistic: {
      title: {
        offsetY: -4,
        customHtml: (container, view, datum) => {
          const { width, height } = container.getBoundingClientRect();
          const d = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
          const text = datum ? datum.type : '总计';
          return renderStatistic(d, text, {
            fontSize: 28
          });
        }
      },
      content: {
        offsetY: 4,
        style: {
          fontSize: '32px'
        },
        customHtml: (container, view, datum, data = []) => {
          const { width } = container.getBoundingClientRect();
          const text = datum
            ? `¥ ${datum.value}`
            : `¥ ${data.reduce((r, d) => r + d.value, 0)}`;
          return renderStatistic(width, text, {
            fontSize: 32
          });
        }
      }
    },
    // 添加 中心统计文本 交互
    interactions: [
      {
        type: 'element-selected'
      },
      {
        type: 'element-active'
      },
      {
        type: 'pie-statistic-active'
      }
    ]
  };
  const configRadialBar: RadialBarConfig = {
    data: [
      {
        name: 'X6',
        star: 297
      },
      {
        name: 'G',
        star: 506
      },
      {
        name: 'AVA',
        star: 805
      },
      {
        name: 'G2Plot',
        star: 1478
      },
      {
        name: 'L7',
        star: 2029
      },
      {
        name: 'G6',
        star: 7100
      },
      {
        name: 'F2',
        star: 7346
      },
      {
        name: 'G2',
        star: 10178
      }
    ],
    xField: 'name',
    yField: 'star',
    maxAngle: 270,
    // 最大旋转角度,
    radius: 0.8,
    innerRadius: 0.2,
    tooltip: {
      formatter: (datum) => {
        return {
          name: 'star数',
          value: datum.star
        };
      }
    },
    colorField: 'star',
    color: ({ star }) => {
      if (star > 10000) {
        return '#36c361';
      } else if (star > 1000) {
        return '#2194ff';
      }

      return '#ff4d4f';
    }
  };
  return (
    <Row gutter={16} style={{ marginTop: 16 }}>
      <Col span={8}>
        <Card
          headStyle={cardHeadStyle}
          title="转化率"
          bordered={false}
          loading={loading}
        >
          <Pie {...configPie} />
        </Card>
      </Col>
      <Col span={8}>
        <Card
          loading={loading}
          headStyle={cardHeadStyle}
          title="玉珏图"
          bordered={false}
        >
          <RadialBar {...configRadialBar} />
        </Card>
      </Col>
      <Col span={8}>
        <Card
          loading={loading}
          headStyle={cardHeadStyle}
          title="词云图"
          bordered={false}
        >
          <DemoWordCloud />
        </Card>
      </Col>
    </Row>
  );
}

const DemoWordCloud = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    asyncFetch();
  }, []);

  const asyncFetch = () => {
    fetch(
      'https://gw.alipayobjects.com/os/antvdemo/assets/data/antv-keywords.json'
    )
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch((error) => {
        console.log('fetch data failed', error);
      });
  };
  const config: WordCloudConfig = {
    data,
    wordField: 'name',
    weightField: 'value',
    colorField: 'name',
    imageMask:
      'https://gw.alipayobjects.com/mdn/rms_2274c3/afts/img/A*07tdTIOmvlYAAAAAAAAAAABkARQnAQ',
    wordStyle: {
      fontFamily: 'Verdana',
      fontSize: [8, 32]
    }
  };

  return <WordCloud {...config} />;
};
