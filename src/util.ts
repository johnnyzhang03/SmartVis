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

export function extractPythonCode(input: string, filePath: string): string {
  const regex = /```python\s+([\s\S]*?)\s+```/g;
  let match;
  let result = '';

  while ((match = regex.exec(input)) !== null) {
    result += match[1] + '\n'; // Add a newline for separation between blocks
  }
  result = replaceFilePathInPythonCode(result, filePath);
  return result.trim(); // Remove the last newline
}

function replaceFilePathInPythonCode(input: string, target: string): string {
  const regex = /pd\.read_csv\(([^)]+)\)/;
  return input.replace(regex, `pd.read_csv('${target}')`);
}

/**
 * Extracts the content between <Title> and </Title> tags from the given string.
 * @param input The input string containing the <Title> tags.
 * @returns The extracted content of the <Title> tag.
 */
export function extractTitleContent(input: string): string {
  const titleRegex = /<Title>(.*?)<\/Title>/;
  const match = input.match(titleRegex);
  return match ? match[1] : '';
}

/**
 * Extracts the content between <Description> and </Description> tags from the given string.
 * @param input The input string containing the <Description> tags.
 * @returns The extracted content of the <Description> tag.
 */
export function extractDescriptionContent(input: string): string {
  const descriptionRegex = /<Description>(.*?)<\/Description>/;
  const match = input.match(descriptionRegex);
  return match ? match[1] : '';
}
