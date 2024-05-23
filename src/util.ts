import { NotebookActions, Notebook } from '@jupyterlab/notebook';

import { CodeCell, Cell } from '@jupyterlab/cells';

/**
 * Iterate through the notebook and find the cell with the given ID
 */
export function findCellById(notebook: Notebook, id: string): Cell | null {
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
export function findCellByTemplateString(
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
export function findCellIndexById(notebook: Notebook, id: string): number {
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
export function selectCellById(notebook: Notebook, id: string): void {
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
export function deleteCell(notebook: Notebook, cell: Cell): void {
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

export function extractPythonCode(
  input: string,
  filePath: string
): string | null {
  const regex = /```python\s+([\s\S]*?)\s+```/g;
  let match;
  let result = '';

  while ((match = regex.exec(input)) !== null) {
    result += match[1] + '\n'; // Add a newline for separation between blocks
  }
  result = replaceFilePathInPythonCode(result, filePath);
  return result.trim(); // Remove the last newline
}

function replaceFilePathInPythonCode(
  input: string,
  targetFilePath: string
): string {
  const regex = /pd\.read_csv\(['"]([^'"]*)['"]\)/g;
  return input.replace(regex, `pd.read_csv('${targetFilePath}')`);
}
