import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import {RenderedCommon, renderText} from "@jupyterlab/rendermime"

import { Widget } from '@lumino/widgets';
import { eventCenter } from './event';

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
    console.log("stderr render created")
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
      console.log(data)
      eventCenter.emit("fixCurrentCell", data)
    })

  // // Create the HTML content.
  //   const content = sanitizer.sanitize(ansiSpan(source), {
  //   allowedTags: ['div']
  // });;
  //   let htmlData = ansiSpan(data);
  //   this.div.innerHTML = content


  //   return Promise.resolve();
  }


  private button: HTMLButtonElement;
  private div: HTMLDivElement;
  private _mimeType: string;

  
}

const ANSI_COLORS = [
  'ansi-black',
  'ansi-red',
  'ansi-green',
  'ansi-yellow',
  'ansi-blue',
  'ansi-magenta',
  'ansi-cyan',
  'ansi-white',
  'ansi-black-intense',
  'ansi-red-intense',
  'ansi-green-intense',
  'ansi-yellow-intense',
  'ansi-blue-intense',
  'ansi-magenta-intense',
  'ansi-cyan-intense',
  'ansi-white-intense'
];

function ansiSpan(str: string): string {
  const ansiRe = /\x1b\[(.*?)([@-~])/g; // eslint-disable-line no-control-regex
  let fg: number | Array<number> = [];
  let bg: number | Array<number> = [];
  let bold = false;
  let underline = false;
  let inverse = false;
  let match;
  const out: Array<string> = [];
  const numbers = [];
  let start = 0;

  str = escape(str);

  str += '\x1b[m'; // Ensure markup for trailing text
  // tslint:disable-next-line
  while ((match = ansiRe.exec(str))) {
    if (match[2] === 'm') {
      const items = match[1].split(';');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item === '') {
          numbers.push(0);
        } else if (item.search(/^\d+$/) !== -1) {
          numbers.push(parseInt(item, 10));
        } else {
          // Ignored: Invalid color specification
          numbers.length = 0;
          break;
        }
      }
    } else {
      // Ignored: Not a color code
    }
    const chunk = str.substring(start, match.index);
    pushColoredChunk(chunk, fg, bg, bold, underline, inverse, out);
    start = ansiRe.lastIndex;

    while (numbers.length) {
      const n = numbers.shift();
      switch (n) {
        case 0:
          fg = bg = [];
          bold = false;
          underline = false;
          inverse = false;
          break;
        case 1:
        case 5:
          bold = true;
          break;
        case 4:
          underline = true;
          break;
        case 7:
          inverse = true;
          break;
        case 21:
        case 22:
          bold = false;
          break;
        case 24:
          underline = false;
          break;
        case 27:
          inverse = false;
          break;
        case 30:
        case 31:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
          fg = n - 30;
          break;
        case 38:
          try {
            fg = getExtendedColors(numbers);
          } catch (e) {
            numbers.length = 0;
          }
          break;
        case 39:
          fg = [];
          break;
        case 40:
        case 41:
        case 42:
        case 43:
        case 44:
        case 45:
        case 46:
        case 47:
          bg = n - 40;
          break;
        case 48:
          try {
            bg = getExtendedColors(numbers);
          } catch (e) {
            numbers.length = 0;
          }
          break;
        case 49:
          bg = [];
          break;
        case 90:
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:
        case 96:
        case 97:
          fg = n - 90 + 8;
          break;
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
          bg = n - 100 + 8;
          break;
        default:
        // Unknown codes are ignored
      }
    }
  }
  return out.join('');
}

function pushColoredChunk(
  chunk: string,
  fg: number | Array<number>,
  bg: number | Array<number>,
  bold: boolean,
  underline: boolean,
  inverse: boolean,
  out: Array<string>
): void {
  if (chunk) {
    const classes = [];
    const styles = [];

    if (bold && typeof fg === 'number' && 0 <= fg && fg < 8) {
      fg += 8; // Bold text uses "intense" colors
    }
    if (inverse) {
      [fg, bg] = [bg, fg];
    }

    if (typeof fg === 'number') {
      classes.push(ANSI_COLORS[fg] + '-fg');
    } else if (fg.length) {
      styles.push(`color: rgb(${fg})`);
    } else if (inverse) {
      classes.push('ansi-default-inverse-fg');
    }

    if (typeof bg === 'number') {
      classes.push(ANSI_COLORS[bg] + '-bg');
    } else if (bg.length) {
      styles.push(`background-color: rgb(${bg})`);
    } else if (inverse) {
      classes.push('ansi-default-inverse-bg');
    }

    if (bold) {
      classes.push('ansi-bold');
    }

    if (underline) {
      classes.push('ansi-underline');
    }

    if (classes.length || styles.length) {
      out.push('<span');
      if (classes.length) {
        out.push(` class="${classes.join(' ')}"`);
      }
      if (styles.length) {
        out.push(` style="${styles.join('; ')}"`);
      }
      out.push('>');
      out.push(chunk);
      out.push('</span>');
    } else {
      out.push(chunk);
    }
  }
}

function getExtendedColors(numbers: Array<number>): number | Array<number> {
  let r;
  let g;
  let b;
  const n = numbers.shift();
  if (n === 2 && numbers.length >= 3) {
    // 24-bit RGB
    r = numbers.shift()!;
    g = numbers.shift()!;
    b = numbers.shift()!;
    if ([r, g, b].some(c => c < 0 || 255 < c)) {
      throw new RangeError('Invalid range for RGB colors');
    }
  } else if (n === 5 && numbers.length >= 1) {
    // 256 colors
    const idx = numbers.shift()!;
    if (idx < 0) {
      throw new RangeError('Color index must be >= 0');
    } else if (idx < 16) {
      // 16 default terminal colors
      return idx;
    } else if (idx < 232) {
      // 6x6x6 color cube, see https://stackoverflow.com/a/27165165/500098
      r = Math.floor((idx - 16) / 36);
      r = r > 0 ? 55 + r * 40 : 0;
      g = Math.floor(((idx - 16) % 36) / 6);
      g = g > 0 ? 55 + g * 40 : 0;
      b = (idx - 16) % 6;
      b = b > 0 ? 55 + b * 40 : 0;
    } else if (idx < 256) {
      // grayscale, see https://stackoverflow.com/a/27165165/500098
      r = g = b = (idx - 232) * 10 + 8;
    } else {
      throw new RangeError('Color index must be < 256');
    }
  } else {
    throw new RangeError('Invalid extended color specification');
  }
  return [r, g, b];
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