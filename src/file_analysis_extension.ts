import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';
import { CellModel } from '@jupyterlab/cells';
import { eventCenter } from './event';
import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';
import { extractPythonCode } from './util';

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
    model: 'gpt-4o'
  });
  return response.choices[0].message.content;
}

async function analyzeFileByOpenAI(csvFile: File) {
  const file = await openai.files.create({
    file: csvFile,
    purpose: 'assistants'
  });

  const assistant = await openai.beta.assistants.create({
    instructions: 'You are an expert in analyzing csv file using python.',
    model: 'gpt-4o',
    tools: [{ type: 'code_interpreter' }]
  });

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content:
          'Make sure you 100% stick to the following instruction:\
          1. A file(dataset) is attached along with this instruction. At the beginning, as a code interpreter, write python code to analyze the attached dataset and execute the code in your sandbox to get the domain knowledge of the dataset. DO NOT output the code you write at this step.\
          2. Output Python code to read the dataset. For example, use pd.read_csv(). \
          3. Followed with Python code which performs data visualization based on the domain knowledge you required in step 1. Three different diagrams are recommended. \
          4. Your output should be TEXT ONLY, which contains 100% Python code ONLY without any descriptive text instruction. DO NOT output any file or image.',
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
        console.log(content.text);
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
                trusted: true
              }
            : {}
      });
      const cellList = notebook.model?.cells;
      const cellModel: CellModel = cellList?.get(
        cellList.length - 1
      ) as CellModel;
      cellModel.sharedModel.setSource('Analyzing...');
      const returnMessage = await analyzeFileByOpenAI(file);
      if (typeof returnMessage === 'string') {
        const extractedCode = extractPythonCode(returnMessage, file.name);
        if (typeof extractedCode === 'string') {
          cellModel.sharedModel.setSource(extractedCode);
        }
      }
    });
  }
};

export default plugin;
