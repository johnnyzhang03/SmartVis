import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IStatusBar } from '@jupyterlab/statusbar';

import { Message } from '@lumino/messaging';

import { Widget } from '@lumino/widgets';

import { eventCenter } from './event'

/**
 * ShoutWidget holds all the plugin's primary functionality.
 * It also creates a widget for JupyterLab's status bar if the
 * status bar is available.
 */
class FileWidget extends Widget {
  private _emptyBlob = new Blob([]);
  private _file = new File([this._emptyBlob], "empty-file.txt", {type: "text/plain"});

  constructor() {
    super();
    const dragUpload = 
      '<form action="#"> \
      <div class="form-group">   \
          <label for="input_1">Upload File</label> \
          <input id="input_1" class="form-control" name="input_1" type="file"> \
      </div> \
      <div class="btn"> \
          <button id="btn_1" type="button">Analyze File</button> \
      </div> \
      </form>';
    let form = document.createElement('div');
    form.innerHTML = dragUpload;

    this.node.appendChild(form);
  }

  /**
   * Callback when the widget is added to the DOM
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    let fileUploader = document.getElementById("input_1") as HTMLInputElement;

    // Add a listener to "Upload File"
    fileUploader?.addEventListener('change', () => {
          // Get the file when a new file is uploaded
          if(fileUploader && fileUploader.files) {
              this._file = fileUploader.files[0];
          }
      });

    // Add a listener to the "Analyze File" button
    document.getElementById("btn_1")?.addEventListener("click", () => {
      eventCenter.emit("addNewCell", this._file);
    });
  }

  /**
   * Callback when the widget is removed from the DOM
   */
  protected onBeforeDetach(msg: Message): void {
    document.getElementById("btn_1")?.removeEventListener("click", ()=> {
      eventCenter.emit("addNewCell", this._file);
    });
    super.onBeforeDetach(msg);
  }  
}

/**
 * JupyterLab extensions are made up of plugin(s). You can specify some
 * information about your plugin with the properties defined here. This
 * extension exports a single plugin, and lists the IStatusBar from
 * JupyterLab as optional.
 */
const fileDrag: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/shout-button:plugin',
  description:
    'An extension that adds a button and message to the right toolbar, with optional status bar widget in JupyterLab.',
  autoStart: true,
  // The IStatusBar is marked optional here. If it's available, it will
  // be provided to the plugin as an argument to the activate function
  // (shown below), and if not it will be null.
  optional: [IStatusBar],
  // Make sure to list any 'requires' and 'optional' features as arguments
  // to your activate function (activate is always passed an Application,
  // then required arguments, then optional arguments)
  activate: (app: JupyterFrontEnd, statusBar: IStatusBar | null) => {
    console.log('JupyterLab extension shout_button_message is activated!');

    // Create a ShoutWidget and add it to the interface in the right sidebar
    const fileWidget: FileWidget = new FileWidget();
    fileWidget.id = 'JupyterFileWidget'; // Widgets need an id
    app.shell.add(fileWidget, 'right');
  }
};

export { fileDrag };