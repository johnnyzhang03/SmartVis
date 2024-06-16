import React, { useState } from 'react';
import { Spin, Pagination, Button } from 'antd';
import { ChartInformation } from '../openai';

const contentStyle: React.CSSProperties = {
  padding: 50,
  background: 'rgba(0, 0, 0, 0.05)',
  borderRadius: 4
};
const content = <div style={contentStyle} />;
const Loading: React.FC = () => (
  <Spin tip="Loading" size="large">
    {content}
  </Spin>
);

export default function ChartChoices({
  showCharts,
  responseList,
  handleCodeGeneration
}: {
  showCharts: boolean;
  responseList: ChartInformation[];
  handleCodeGeneration: (index: number) => void;
}) {
  const [listIndex, setListIndex] = useState(0);
  const Page: React.FC = () => (
    <Pagination
      defaultCurrent={listIndex + 1}
      total={responseList.length * 10}
      onChange={(page, pageSize) => {
        setListIndex(page - 1);
      }}
    />
  );
  return (
    <div className="container">
      {showCharts ? (
        <div className="chart-container">
          <img
            className="chart-image"
            src={responseList[listIndex].src}
            alt={`Image ${listIndex}`}
          />
          <h2>{responseList[listIndex].title}</h2>
          <p>{responseList[listIndex].description}</p>
          <div className="code-btn">
            <Button
              type="primary"
              onClick={() => {
                handleCodeGeneration(responseList.length - listIndex - 1);
              }}
            >
              Show Code
            </Button>
          </div>
          <Page></Page>
        </div>
      ) : (
        <Loading></Loading>
      )}
    </div>
  );
}
