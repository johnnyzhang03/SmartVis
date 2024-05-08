import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';

import { CellModel } from '@jupyterlab/cells';
import { eventCenter } from './event';
import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';

const openai = new OpenAI({
  apiKey: '',
  dangerouslyAllowBrowser: true
});

export async function passToOpenAI(code: string) {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content:
          code +
          ' ' +
          'Please explain the structure and function of my code. Give your answer in the form of python comment.'
      }
    ],
    model: 'gpt-3.5-turbo'
  });
  return response.choices[0].message.content;
}

async function analyzeFileByOpenAI(csvFile: File) {
  const file = await openai.files.create({
    file: csvFile,
    purpose: 'assistants'
  });

  const assistant = await openai.beta.assistants.create({
    instructions:
      "You are an expert in analyzing csv file using python. Your job includes dataset overview, data cleaning, data preprocessing and data visualization. Please read through the csv file first and tailor every step based on the dataset's actual characteristics. Finally, you only need to output the python code, no need to run the result for me.",
    model: 'gpt-3.5-turbo',
    tools: [{ type: 'code_interpreter' }]
  });

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content:
          "Please perform the dataset overview and data cleaning. The only thing you should output is the relevant Python code, don't say anything else and omit of the ```python ```  in your response please.",
        attachments: [
          {
            file_id: file.id,
            tools: [{ type: 'code_interpreter' }]
          }
        ]
      }
    ]
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id
  });

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    for (const message of messages.data.reverse()) {
      if (message.role === 'assistant') {
        const content = <TextContentBlock>message.content[0];
        return content.text.value;
      }
    }
  } else {
    return run.status;
  }
}

/**
 * Initialization data for the @shannon-shen/chapyter extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'gpt_csv_analysis',
  description: 'A Natural Language-Based Python Program Interpreter',
  autoStart: true,
  requires: [INotebookTracker],
  // optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    eventCenter.on('fixCurrentCell', async data => {
      let notebook = tracker.currentWidget!;
      let activeCell = notebook.content.activeCell!;
      const sourceCode = activeCell.model.sharedModel.getSource();
      let response = await passToOpenAI(sourceCode);
      activeCell.model.sharedModel.setSource(`#New Code\n${response}`);
    });

    eventCenter.on('addNewCell', async file => {
      const notebook = tracker.currentWidget!.content;
      const model = tracker.currentWidget!.model;
      model?.sharedModel.addCell({
        cell_type: 'code',
        metadata:
          notebook?.notebookConfig.defaultCell === 'code'
            ? {
                // This is an empty cell created by user, thus is trusted
                trusted: true
              }
            : {}
      });
      const cellList = notebook.model?.cells;
      const cellModel: CellModel = cellList?.get(
        cellList.length - 1
      ) as CellModel;
      cellModel.sharedModel.setSource('Analyzing...');
      const returnCode = await analyzeFileByOpenAI(file);
      if (typeof returnCode === 'string') {
        cellModel.sharedModel.setSource(returnCode);
      }
    });
  }
};

export default plugin;
