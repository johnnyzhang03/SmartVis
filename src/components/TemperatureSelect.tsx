import React from 'react';
import { Slider } from 'antd';
import type { SliderSingleProps } from 'antd';

const marks: SliderSingleProps['marks'] = {
  0: '0°C',
  100: {
    style: {
      color: '#f50',
    },
    label: <strong>100°C</strong>,
  },
};

export const TemperatureSelect: React.FC = () => (
  <>
    <h4>Model Temperature: </h4>
    <Slider marks={marks} defaultValue={37} />
  </>
);