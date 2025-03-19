export enum CommandType {
  'copy' = 'copy',
  'paste' = 'paste',
  'cut' = 'cut',
  'delete' = 'delete',
  'undo' = 'undo',
  'redo' = 'redo',

  'holdUndo' = 'holdUndo',
  'holdRedo' = 'holdRedo',

  'rotateCounterClockwise' = 'rotateCounterClockwise',
  'rotateClockwise' = 'rotateClockwise',
  'mirrorHorizontal' = 'mirrorHorizontal',
  'mirrorVertical' = 'mirrorVertical',

  'selectAll' = 'selectAll',

  'moveToFront' = 'moveToFront',
  'moveForward' = 'moveForward',
  'moveBackward' = 'moveBackward',
  'moveToBack' = 'moveToBack',

  'arrangeLeft' = 'arrangeLeft',
  'arrangeCenter' = 'arrangeCenter',
  'arrangeRight' = 'arrangeRight',
  'arrangeTop' = 'arrangeTop',
  'arrangeMiddle' = 'arrangeMiddle',
  'arrangeBottom' = 'arrangeBottom',

  'unifyWidth' = 'unifyWidth',
  'unifyHeight' = 'unifyHeight',

  'distributeHorizontal' = 'distributeHorizontaly',
  'distributeVertical' = 'distributeVertical',

  'setTool' = 'setTool',

  'setStrokeColor' = 'setStrokeColor',
  'setFillBrush' = 'setFillBrush',
  'setStrokeThickness' = 'setStrokeThickness',
  
  'screenshot' = 'screenshot',
}