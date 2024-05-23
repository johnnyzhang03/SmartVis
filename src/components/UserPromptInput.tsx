import React from 'react';
import { Input } from 'antd';

const { TextArea } = Input;

export const UserPromptInupt: React.FC = () => {

  return (
    <>
      <TextArea
        placeholder="Please input your additional requirement for data visualization"
        autoSize={{ minRows: 2, maxRows: 6 }}
      />
    </>
  );
};