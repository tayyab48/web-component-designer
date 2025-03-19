import { IDesignItem } from "../../item/IDesignItem.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IStringPosition } from "../htmlWriterService/IStringPosition.js";
import { IDesignItemDocumentPositionService } from "./IDesignItemDocumentPositionService.js";

export class DesignItemDocumentPositionService implements IDesignItemDocumentPositionService {

    private _designItemsAssignmentList?: WeakMap<IDesignItem, IStringPosition> = new WeakMap();

    constructor(designerCanvas: IDesignerCanvas) { }

    setPosition(designItem: IDesignItem, position: IStringPosition) {
        this._designItemsAssignmentList.set(designItem, position);
    }

    getPosition(designItem: IDesignItem): IStringPosition {
        return this._designItemsAssignmentList.get(designItem);
    }
}