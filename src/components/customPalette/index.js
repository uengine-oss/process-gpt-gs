import PaletteProvider from './PaletteProvider';
import CustomSplitLaneHandler from './CustomSplitLaneHandler';

export default {
  __init__: [ 'paletteProvider', 'customSplitLaneHandler'],
  paletteProvider: [ 'type', PaletteProvider ],
  customSplitLaneHandler: [ 'type', CustomSplitLaneHandler ]
};