import { IDesignItem } from '../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { AbstractExtension } from './AbstractExtension.js';
import { IExtensionManager } from './IExtensionManger.js';
import { OverlayLayer } from './OverlayLayer.js';

export class PaddingExtension extends AbstractExtension {
  constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
    super(extensionManager, designerView, extendedItem);
  }

  private _path: SVGPathElement;
  private _path2: SVGPathElement;

  override extend(cache: Record<string | symbol, any>, event?: Event) {
    this.refresh(cache, event);
  }

  override refresh(cache: Record<string | symbol, any>, event?: Event) {
    const computedStyle = getComputedStyle(this.extendedItem.element);
    if (computedStyle.padding !== '0px') {
      let left = Number.parseFloat(computedStyle.paddingLeft.replace('px', ''));
      let top = Number.parseFloat(computedStyle.paddingTop.replace('px', ''));
      let right = Number.parseFloat(computedStyle.paddingRight.replace('px', ''));
      let bottom = Number.parseFloat(computedStyle.paddingBottom.replace('px', ''));

      left += Number.parseFloat(computedStyle.borderLeftWidth.replace('px', ''));
      top += Number.parseFloat(computedStyle.borderTopWidth.replace('px', ''));
      right += Number.parseFloat(computedStyle.borderRightWidth.replace('px', ''));
      bottom += Number.parseFloat(computedStyle.borderBottomWidth.replace('px', ''));
      if (!isNaN(left) && !isNaN(top) && !isNaN(right) && !isNaN(bottom)) {
        const p = this.extendedItem.element.getBoxQuads({ box: 'border', relativeTo: this.designerCanvas.canvas })[0];
        if (!isNaN(p.p1.x)) {
          if (this._valuesHaveChanges(left, top, right, bottom, p.p1.x, p.p1.y, p.p2.x, p.p2.y, p.p3.x, p.p3.y, p.p4.x, p.p4.y)) {
            const p2 = this.extendedItem.element.getBoxQuads({ box: 'content', relativeTo: this.designerCanvas.canvas })[0];
            let d = "M" + [p.p1, p.p2, p.p3, p.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
            d += "M" + [p2.p1, p2.p2, p2.p3, p2.p4].map(x => x.x + ',' + x.y).join(' ') + 'Z ';
            this._path = this._drawPath(d, 'svg-padding-fill', this._path, OverlayLayer.Background);
            this._path2 = this._drawPath(d, 'svg-padding', this._path2, OverlayLayer.Background);
          }
        }
      }
    }
  }

  override dispose() {
    this._removeAllOverlays();
  }
}