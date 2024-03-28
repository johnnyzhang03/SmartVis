import { Widget } from '@lumino/widgets';

import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
    INotebookTracker,
    NotebookPanel,
} from '@jupyterlab/notebook';

import {
    Cell,
    ICellFooter
} from '@jupyterlab/cells';

import { IEditorServices } from '@jupyterlab/codeeditor';

import {
    CommandRegistry,
} from '@lumino/commands';

import '../style/index.css';

import { passToOpenAI } from './chapyter_extension';


/**
 * The CSS classes added to the cell footer.
 */
const CELL_FOOTER_CLASS = 'jp-CellFooter';

async function activate(app: JupyterFrontEnd, tracker: INotebookTracker): Promise<void> {
    Promise.all([app.restored]).then(() => {
        const { commands, shell } = app;
        function isEnabled(): boolean {
            return tracker.currentWidget !== null &&
                tracker.currentWidget === app.shell.currentWidget;
        }

        commands.addCommand('explain-code', {
            label: 'Run Cell',
            execute: async () => {
                let notebook = tracker.currentWidget!;
                let activeCell = notebook.content.activeCell!
                const sourceCode = activeCell.model.sharedModel.getSource()
                let response = await passToOpenAI(sourceCode)
                activeCell.model.sharedModel.setSource(sourceCode + `\n\n# Code Explanation:\n${response}`)
            },
            isEnabled,
        });
    });
    return Promise.resolve();
}

/**
 * Extend the default implementation of an `IContentFactory`.
 */
export class NewContentFactory extends NotebookPanel.ContentFactory {

    constructor(commands: CommandRegistry, options: Cell.ContentFactory.IOptions) {
        super(options);
        this.commands = commands;
    }

    createCellFooter(): ICellFooter {
        return new CellFooterWithButton(this.commands);
    }

    private readonly commands: CommandRegistry;
}

/**
 * Extend default implementation of a cell footer.
 */
export class CellFooterWithButton extends Widget implements ICellFooter {
    constructor(commands: CommandRegistry) {
        let node = document.createElement('div');
        let button = document.createElement('button');
        button.textContent = "Explian Code";
        node.appendChild(button);
        super({ node: node });
        this.commands = commands;
        this.addClass(CELL_FOOTER_CLASS);

        button.addEventListener("click", () => {
            this.commands.execute('explain-code');
        })
    }

    private readonly commands: CommandRegistry;

}

/**
 * The foot button extension for the code cell.
 */
const footerButtonExtension: JupyterFrontEndPlugin<void> = {
    id: 'jupyterlab-cellcodebtn',
    autoStart: true,
    requires: [INotebookTracker],
    activate: activate
};

/**
 * The notebook cell factory provider.
 */
const cellFactory: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
    id: 'jupyterlab-cellcodebtn:factory',
    provides: NotebookPanel.IContentFactory,
    requires: [IEditorServices],
    autoStart: true,
    activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
        const commands = app.commands;
        let editorFactory = editorServices.factoryService.newInlineEditor;
        return new NewContentFactory(commands, { editorFactory });
    }
};

export { footerButtonExtension, cellFactory };