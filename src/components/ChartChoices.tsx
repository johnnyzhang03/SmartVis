import React from 'react';
import { Spin } from 'antd';
import { ChartInformation } from '../openai';

const contentStyle: React.CSSProperties = {
  padding: 50,
  background: 'rgba(0, 0, 0, 0.05)',
  borderRadius: 4,
};
const content = <div style={contentStyle} />;
const Loading: React.FC = () => (
  <Spin tip="Loading" size="large">
      {content}
  </Spin>
)

export default function ChartChoices({ showCharts, responseList }: { showCharts: boolean; responseList: ChartInformation[] }) {
return (
  <div className='container'>
    {showCharts ? (
      <div>Charts</div>
    ) : (
      <Loading></Loading>
    )}
  </div>
)

}
