import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { eventCenter } from './event';
import { IStatusBar } from '@jupyterlab/statusbar';
import { CellModel } from '@jupyterlab/cells';
import { ReactWidget } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';
import SidePanel from './components/SidePanel';
import React from 'react';
import { generateChart } from './openai';
import { extractPythonCode } from './util';

export const smartVis: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/shout-button:plugin',
  description:
    'An extension that provides AI code assistant for data visualization at the sidebar.',
  autoStart: true,
  optional: [IStatusBar],
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    // UI part
    const myWidget: Widget = ReactWidget.create(<SidePanel />);
    myWidget.id = 'SidePanelAIAssistant';
    myWidget.title.iconClass = 'jbook-icon jp-SideBar-tabIcon';
    myWidget.title.className = 'jbook-tab';
    myWidget.title.caption = 'Side panel for AI';
    app.shell.add(myWidget, 'right');

    // Function part
    // eventCenter.on('fixCurrentCell', async () => {
    //   let notebook = tracker.currentWidget!;
    //   let activeCell = notebook.content.activeCell!;
    //   const sourceCode = activeCell.model.sharedModel.getSource();
    //   let response = await passToOpenAI(sourceCode);
    //   activeCell.model.sharedModel.setSource(`#New Code\n${response}`);
    // });

    eventCenter.on('addNewCell', async file => {
      const notebook = tracker.currentWidget!.content;
      const model = tracker.currentWidget!.model;
      console.log('still here')
      model?.sharedModel.addCell({
        cell_type: 'code',
        metadata:
          notebook?.notebookConfig.defaultCell === 'code'
            ? {
                trusted: true
              }
            : {}
      });
      const cellList = notebook.model?.cells;
      const cellModel: CellModel = cellList?.get(
        cellList.length - 1
      ) as CellModel;
      cellModel.sharedModel.setSource('Analyzing...');
      const returnMessage = await generateChart(file);
      if (typeof returnMessage === 'string') {
        const extractedCode = extractPythonCode(returnMessage, file.name);
      if (typeof extractedCode === 'string') {
        cellModel.sharedModel.setSource(extractedCode);
      }
      }
    });
  }
};