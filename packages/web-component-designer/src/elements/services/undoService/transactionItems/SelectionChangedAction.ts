import { ITransactionItem } from '../ITransactionItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { ISelectionService } from '../../selectionService/ISelectionService.js';
import { SelectionService } from '../../selectionService/SelectionService.js';

export class SelectionChangedAction implements ITransactionItem {

    constructor(oldSelection: IDesignItem[], newSelection: IDesignItem[], selectionService: ISelectionService) {
        this.title = "Change Selection";

        this.oldSelection = oldSelection;
        this.newSelection = newSelection;
        this.selectionService = selectionService;
    }

    title?: string;

    get affectedItems() {
        if (this.oldSelection && this.newSelection)
            return [...this.oldSelection, ...this.newSelection];
        if (this.oldSelection)
            return [...this.oldSelection];
        return [...this.newSelection];
    }

    undo() {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.oldSelection);
    }

    do() {
        (<SelectionService>this.selectionService)._withoutUndoSetSelectedElements(this.newSelection);
    }

    public oldSelection: IDesignItem[];
    public newSelection: IDesignItem[];
    public selectionService: ISelectionService

    mergeWith(other: ITransactionItem) {
        return false
    }
}