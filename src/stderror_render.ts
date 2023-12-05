import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Widget } from '@lumino/widgets';

// import movieIcon from '../style/movie.svg';

/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/vnd.jupyter.stderr';

/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-stderr';

/**
 * A widget for rendering stderr.
 */
export class StdErrorWidget extends Widget implements IRenderMime.IRenderer {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super();
    console.log("stderr render created")
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    this._video = document.createElement('button');
    this._video.textContent = "PLZ Fix by AI";
    this.node.appendChild(this._video);
  }

  /**
   * Render stderr into this widget's node.
   */
  renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    let data = model.data[this._mimeType] as string;

    return Promise.resolve();
  }


  private _video: HTMLButtonElement;
  private _mimeType: string;
}


/**
 * A mime renderer factory for stderr data.
 */
export const rendererFactory: IRenderMime.IRendererFactory = {
  safe: true,
  mimeTypes: [MIME_TYPE],
  createRenderer: options => new StdErrorWidget(options)
};

/**
 * Extension definition.
 */
const extension: IRenderMime.IExtension = {
  id: '@jupyterlab-examples/mimerenderer:stderr',
  // description: 'Adds MIME type renderer for stderr content',
  rendererFactory,
  rank: 0,
  dataType: 'string',
  fileTypes: [
    {
      name: 'stderr',
      extensions: ['.stderr'],
      fileFormat: 'base64',
    //   icon: {
    //     name: '@jupyterlab-examples/mimerenderer:video',
    //     svgstr: movieIcon
    //   },
      mimeTypes: [MIME_TYPE]
    }
  ],
  documentWidgetFactoryOptions: {
    name: 'JupyterLab stderr Viewer',
    primaryFileType: 'stderr',
    modelName: 'base64',
    fileTypes: ['stderr'],
    defaultFor: ['stderr']
  }
};

export default extension;