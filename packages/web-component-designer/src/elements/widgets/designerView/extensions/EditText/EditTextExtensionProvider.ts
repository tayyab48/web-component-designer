import { IDesignerExtensionProvider } from '../IDesignerExtensionProvider.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { IDesignerExtension } from '../IDesignerExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';
import { EditTextExtension } from "./EditTextExtension.js";
import { css } from '@node-projects/base-custom-webcomponent';

export class EditTextExtensionProvider implements IDesignerExtensionProvider {
  shouldExtend(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): boolean {
    if (designItem.isRootItem)
      return false;
    if (designItem.name === 'input')
      return false;
    return true;
  }

  getExtension(extensionManager: IExtensionManager, designerView: IDesignerCanvas, designItem: IDesignItem): IDesignerExtension {
    return new EditTextExtension(extensionManager, designerView, designItem);
  }

  static readonly style = css`
    .svg-edit-text-clickoutside { stroke: transparent; fill: lightgray; opacity: 0.7 }
  `;
}