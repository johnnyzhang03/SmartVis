import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { eventCenter } from './event';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import { Button } from 'antd';
import FileUpload from "./components/FileUpload";
import { TemperatureSelect } from './components/TemperatureSelect';
import React, { useState } from 'react';
import { UserPromptInupt } from './components/UserPromptInput';

function SidePanel() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  function handleGenerateClick() {
    if (uploadedFile) {
      eventCenter.emit('addNewCell', uploadedFile);
    } else {
      alert("No file uploaded.");
    }
  };
  return (
    <div className='container'>
      <div className='upload'>
        <FileUpload setFile={setUploadedFile}/>
      </div>
      <div className='user-prompt'>
        <UserPromptInupt></UserPromptInupt>
      </div>
      <div className='temperature'>
        <TemperatureSelect></TemperatureSelect>
      </div>
      <div className='button-container'>
        <Button type="primary" onClick={handleGenerateClick}>Generate</Button>
      </div>
    </div>
  )
}

export const side_panel: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/shout-button:plugin',
  description:
    'An extension that provides AI code assistant for data visualization at the sidebar.',
  autoStart: true,
  optional: [IStatusBar],
  activate: (app: JupyterFrontEnd, statusBar: IStatusBar | null) => {
    console.log('side panel ready');
    const myWidget: Widget = ReactWidget.create(<SidePanel />);
    myWidget.id = 'SidePanelAIAssistant';
    myWidget.title.iconClass = 'jbook-icon jp-SideBar-tabIcon';
    myWidget.title.className = 'jbook-tab';
    myWidget.title.caption = 'Side panel for AI';
    app.shell.add(myWidget, 'right');
  }
};