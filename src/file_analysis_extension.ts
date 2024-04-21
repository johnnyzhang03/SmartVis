import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  INotebookTracker,
  NotebookActions,
  Notebook
} from '@jupyterlab/notebook';

import { CodeCell, Cell, CellModel } from '@jupyterlab/cells';
import { eventCenter } from './event';
import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';

const openai = new OpenAI({
  apiKey: '',
  dangerouslyAllowBrowser: true
});

/**
 * Iterate through the notebook and find the cell with the given ID
 */
function findCellById(notebook: Notebook, id: string): Cell | null {
  for (let i = 0; i < notebook.widgets.length; i++) {
    let cell = notebook.widgets[i];
    if (cell.model.id === id) {
      return cell;
    }
  }
  return null;
}

/**
 * Iterate through the notebook and find the code cell that starts with the
 * given template string. In our case, the template string is simply a manual
 * template that's inserted by Chapyter.
 */
function findCellByTemplateString(
  notebook: Notebook,
  executionId: string | number | null
): CodeCell | null {
  if (executionId) {
    const searchTempalte = `# Assistant Code for Cell [${executionId}]:`;

    for (let i = 0; i < notebook.widgets.length; i++) {
      let cell = notebook.widgets[i];
      if (cell.model.type === 'code') {
        let codeCell = cell as CodeCell;
        let codeCellText = codeCell.model.sharedModel.getSource();
        if (codeCellText.split('\n')[0].startsWith(searchTempalte)) {
          return cell as CodeCell;
        }
      }
    }
  }
  return null;
}

/**
 * Find the index of the cell with the given ID
 */
function findCellIndexById(notebook: Notebook, id: string): number {
  for (let i = 0; i < notebook.widgets.length; i++) {
    let cell = notebook.widgets[i];
    if (cell.model.id === id) {
      return i;
    }
  }
  return -1;
}

/**
 * Select the target cell based on its id by moving the cursor
 * (using NotebookActions.selectAbove or NotebookActions.selectAbove).
 */
function selectCellById(notebook: Notebook, id: string): void {
  let activeCellIndex = notebook.activeCellIndex;
  let targetCellIndex = findCellIndexById(notebook, id);
  if (targetCellIndex !== -1) {
    if (activeCellIndex !== targetCellIndex) {
      if (activeCellIndex < targetCellIndex) {
        for (let i = activeCellIndex; i < targetCellIndex; i++) {
          if (!notebook.widgets[i].inputHidden) {
            NotebookActions.selectBelow(notebook);
          }
        }
      } else {
        for (let i = activeCellIndex; i > targetCellIndex; i--) {
          if (!notebook.widgets[i].inputHidden) {
            NotebookActions.selectAbove(notebook);
          }
        }
      }
    }
  }
}

/**
 * Delete the cell from the notebook
 */
function deleteCell(notebook: Notebook, cell: Cell): void {
  const model = notebook.model!;
  const sharedModel = model.sharedModel;
  const toDelete: number[] = [];

  notebook.widgets.forEach((child, index) => {
    if (child === cell) {
      const deletable = child.model.getMetadata('deletable') !== false;

      if (deletable) {
        toDelete.push(index);
        notebook.model?.deletedCells.push(child.model.id);
      }
    }
  });

  if (toDelete.length > 0) {
    // Delete the cells as one undo event.
    sharedModel.transact(() => {
      // Delete cells in reverse order to maintain the correct indices.
      toDelete.reverse().forEach(index => {
        sharedModel.deleteCell(index);
      });
    });
    // Select the *first* interior cell not deleted or the cell
    // *after* the last selected cell.
    // Note: The activeCellIndex is clamped to the available cells,
    // so if the last cell is deleted the previous cell will be activated.
    // The *first* index is the index of the last cell in the initial
    // toDelete list due to the `reverse` operation above.
    notebook.activeCellIndex = toDelete[0] - toDelete.length + 1;
  }

  // Deselect any remaining, undeletable cells. Do this even if we don't
  // delete anything so that users are aware *something* happened.
  notebook.deselectAll();
}

export async function passToOpenAI(code: string) {
  const response = await openai.chat.completions
    .create({ messages: [{ role: 'user', content: code + " " + 'Please explain the structure and function of my code. Give your answer in the form of python comment.' }], model: 'gpt-3.5-turbo' });
  return response.choices[0].message.content
}

async function analyzeFileByOpenAI(csvFile: File) {
  const file = await openai.files.create({
    file: csvFile,
    purpose: "assistants",
  });

  const assistant = await openai.beta.assistants.create({
    instructions: "You are an expert in analyzing csv file using python. Your job includes dataset overview, data cleaning, data preprocessing and data visualization. Please read through the csv file first and tailor every step based on the dataset's actual characteristics. Finally, you only need to output the python code, no need to run the result for me.",
    model: "gpt-3.5-turbo",
    tools: [{ "type": "code_interpreter" }],
  });
  

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content: "Please perform the dataset overview and data cleaning. The only thing you should output is the relevant Python code, don't say anything else and omit of the ```python ```  in your response please.",
        attachments: [
          {
            file_id: file.id,
            tools: [{ type: "code_interpreter" }]
          }
        ]
      }
    ]
  });


  const run = await openai.beta.threads.runs.createAndPoll(
    thread.id,
    {
      assistant_id: assistant.id,
    }
  );

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(
      run.thread_id
    );
    for (const message of messages.data.reverse()) {
      if (message.role === 'assistant') {
        const content = <TextContentBlock>(message.content[0]);
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
    eventCenter.on('fixCurrentCell', async (data) => {
      let notebook = tracker.currentWidget!;
      let activeCell = notebook.content.activeCell!
      const sourceCode = activeCell.model.sharedModel.getSource()
      let response = await passToOpenAI(sourceCode)
      activeCell.model.sharedModel.setSource(`#New Code\n${response}`)
    });

    eventCenter.on('addNewCell', async (file) => {
      const notebook = tracker.currentWidget!.content;
      const model = tracker.currentWidget!.model;
      model?.sharedModel.addCell({
        cell_type: "code",
        metadata:
          notebook?.notebookConfig.defaultCell === 'code'
            ? {
              // This is an empty cell created by user, thus is trusted
              trusted: true
            }
            : {}
      });
      const cellList = notebook.model?.cells;
      const cellModel: CellModel = cellList?.get(cellList.length - 1) as CellModel
      cellModel.sharedModel.setSource('Analyzing...');
      const returnCode = await analyzeFileByOpenAI(file);
      if (typeof returnCode === 'string') {
        cellModel.sharedModel.setSource(returnCode);
      }
    });
  }
};

export default plugin;