import { IRect } from "../../../../../interfaces/IRect.js";
import { IContextMenuItem } from '../../../../helper/contextMenu/IContextMenuItem.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { ContextmenuInitiator, IContextMenuExtension } from './IContextMenuExtension.js';

const offset = 10;

export class ZoomToElementContextMenu implements IContextMenuExtension {

  public shouldProvideContextmenu(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem, initiator: ContextmenuInitiator) {
    return designItem !== null;
  }

  public provideContextMenuItems(event: MouseEvent, designerCanvas: IDesignerCanvas, designItem: IDesignItem): IContextMenuItem[] {
    return [
      {
        title: 'zoom to', icon: `<img src="${new URL('../../../../../../assets/icons/zoomIn.svg', import.meta.url)}">`, action: () => {
          const coord = designerCanvas.getNormalizedElementCoordinates(designItem.element);
          const startPoint = { x: coord.x - offset, y: coord.y - offset };
          const endPoint = { x: coord.x + coord.width + offset, y: coord.y + coord.height + offset };

          let rect: IRect = {
            x: startPoint.x < endPoint.x ? startPoint.x : endPoint.x,
            y: startPoint.y < endPoint.y ? startPoint.y : endPoint.y,
            width: Math.abs(startPoint.x - endPoint.x),
            height: Math.abs(startPoint.y - endPoint.y),
          }

          let zFactorWidth = designerCanvas.outerRect.width / rect.width;
          let zFactorHeight = designerCanvas.outerRect.height / rect.height;

          let zoomFactor = zFactorWidth >= zFactorHeight ? zFactorHeight : zFactorWidth;

          designerCanvas.zoomPoint({ x: coord.x + coord.width / 2, y: coord.y + coord.height / 2 }, zoomFactor);
        }
      },
    ]
  }
}
