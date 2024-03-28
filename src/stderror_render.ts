import { IRenderMime } from '@jupyterlab/rendermime-interfaces'
import {RenderedCommon, renderText} from "@jupyterlab/rendermime"
import { eventCenter } from './event'

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
export class StdErrorWidget extends RenderedCommon {
  /**
   * Construct a new output widget.
   */
  constructor(options: IRenderMime.IRendererOptions) {
    super(options);
    this._mimeType = options.mimeType;
    this.addClass(CLASS_NAME);
    this.addClass('jp-RenderedText');
    this.button = document.createElement('button');
    this.button.textContent = "Fix by AI";
    this.div = document.createElement("div")
  }
  
  /**
   * Render stderr into this widget's node.
   */
   async render(model: IRenderMime.IMimeModel) {
    const result = await renderText({
      host: this.node,
      sanitizer: this.sanitizer,
      source: String(model.data[this.mimeType]),
      translator: this.translator
    });
    this.node.appendChild(this.button);
    this.node.appendChild(this.div);
    
    let data = model.data[this._mimeType] as string
    data = data.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    this.button.addEventListener("click", ()=> {
      eventCenter.emit("fixCurrentCell", data)
    });
  }


  private button: HTMLButtonElement;
  private div: HTMLDivElement;
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