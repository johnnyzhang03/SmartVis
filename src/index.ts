import command_extension from './command_extension'
import file_analysis_extension from './file_analysis_extension'
import {footerButtonExtension, cellFactory} from './codecell_footer_extension'
import { fileDrag } from './file_drag'
export default [
  command_extension,
  file_analysis_extension,
  footerButtonExtension,
  cellFactory,
  fileDrag
]