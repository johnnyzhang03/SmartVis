import React, { useState } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

const { Dragger } = Upload;

export default function FileUpload({ setFile }: { setFile: (file: File) => void }) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  function handleChange(info: any) {
    let newFileList = [...info.fileList];

    // Only keep the latest uploaded file
    newFileList = newFileList.slice(-1);
    setFileList(newFileList);
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
      // set the file in the parent component
      setFile(info.file.originFileObj); 
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  function customRequest({ file, onSuccess }: any) {
    onSuccess('ok');
  };
    return(
        <Dragger 
          accept='.csv'
          maxCount={1}
          fileList={fileList}
          onChange={handleChange}
          customRequest={customRequest}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
            Only single .csv file is supported.
            </p>
        </Dragger>
    )
};
