import { CommandType } from "../../../commandHandling/CommandType.js";
import { IUiCommand } from "../../../commandHandling/IUiCommand.js";
import { IDesignerCanvas } from "../../widgets/designerView/IDesignerCanvas.js";
import { IModelCommandService } from "./IModelCommandService.js";
import { ArrangeHelper } from "../../helper/ArrangeHelper.js";
import { Orientation } from "../../../enums/Orientation.js";


export class DefaultModelCommandService implements IModelCommandService {
  canExecuteCommand(designerCanvas: IDesignerCanvas, command: IUiCommand): boolean {
    if (command.type == CommandType.moveBackward ||
      command.type == CommandType.moveForward ||
      command.type == CommandType.moveToBack ||
      command.type == CommandType.moveToFront)
      return designerCanvas.instanceServiceContainer.selectionService.primarySelection != null && !designerCanvas.instanceServiceContainer.selectionService.primarySelection.isRootItem;
    if (command.type == CommandType.arrangeBottom ||
      command.type == CommandType.arrangeCenter ||
      command.type == CommandType.arrangeLeft ||
      command.type == CommandType.arrangeMiddle ||
      command.type == CommandType.arrangeRight ||
      command.type == CommandType.arrangeTop ||
      command.type == CommandType.unifyHeight ||
      command.type == CommandType.unifyWidth)
      return designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 1;
    if (command.type == CommandType.rotateCounterClockwise ||
      command.type == CommandType.rotateClockwise ||
      command.type == CommandType.mirrorHorizontal ||
      command.type == CommandType.mirrorVertical)
      return designerCanvas.instanceServiceContainer.selectionService.selectedElements.length > 0 && !designerCanvas.instanceServiceContainer.selectionService.primarySelection.isRootItem;
    return null;
  }

  async executeCommand(designerCanvas: IDesignerCanvas, command: IUiCommand) {
    let sel = designerCanvas.instanceServiceContainer.selectionService.primarySelection;
    const selection = [...designerCanvas.instanceServiceContainer.selectionService.selectedElements];
    if (command.type == CommandType.moveBackward) {
      let idx = sel.parent.indexOf(sel) - 1;
      if (idx >= 0)
        sel.parent.insertChild(sel, idx);
    } else if (command.type == CommandType.moveForward) {
      let idx = sel.parent.indexOf(sel) + 1;
      if (idx < sel.parent.childCount)
        sel.parent.insertChild(sel, idx);
    } else if (command.type == CommandType.moveToBack) {
      sel.parent.insertChild(sel, 0);
    } else if (command.type == CommandType.moveToFront) {
      sel.parent.insertChild(sel);
    } else if (command.type == CommandType.arrangeTop) {
      ArrangeHelper.arrangeElements(Orientation.TOP, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.arrangeRight) {
      ArrangeHelper.arrangeElements(Orientation.RIGHT, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.arrangeLeft) {
      ArrangeHelper.arrangeElements(Orientation.LEFT, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.arrangeBottom) {
      ArrangeHelper.arrangeElements(Orientation.BOTTOM, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.arrangeCenter) {
      ArrangeHelper.arrangeElements(Orientation.HORIZONTAL_CENTER, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.arrangeMiddle) {
      ArrangeHelper.arrangeElements(Orientation.VERTICAL_CENTER, designerCanvas, designerCanvas.instanceServiceContainer.selectionService.selectedElements);
    } else if (command.type == CommandType.unifyHeight) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('unifyHeight');
      const height = designerCanvas.instanceServiceContainer.selectionService.primarySelection.getStyle('height');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('height', height);
      }
      grp.commit();
    } else if (command.type == CommandType.unifyWidth) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('unifyWidth');
      const width = designerCanvas.instanceServiceContainer.selectionService.primarySelection.getStyle('width');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('width', width);
      }
      grp.commit();
    } else if (command.type == CommandType.rotateCounterClockwise) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('rotateCounterClockwise');
      var trf = designerCanvas.instanceServiceContainer.selectionService.primarySelection.getStyle('transform');
      let degree = 0;
      let rotation = "";
      if (trf != null) {
        try {
          if (trf.includes('-'))
            degree = parseInt(trf.match(/\d+/)[0]) * -1;
          else
            degree = parseInt(trf.match(/\d+/)[0]);

          rotation = "rotate(" + (degree - 90) + "deg)";
        }
        catch {
          rotation = "rotate(-90deg)"
        }
      }
      else {
        rotation = "rotate(-90deg)";
      }
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    } else if (command.type == CommandType.rotateClockwise) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('rotateClockwise');
      var trf = designerCanvas.instanceServiceContainer.selectionService.primarySelection.getStyle('transform');
      let degree = 0;
      let rotation = "";
      if (trf != null) {
        try {
          if (trf.includes('-'))
            degree = parseInt(trf.match(/\d+/)[0]) * -1;
          else
            degree = parseInt(trf.match(/\d+/)[0]);

          rotation = "rotate(" + (degree + 90) + "deg)";
        }
        catch {
          rotation = "rotate(90deg)"
        }
      }
      else {
        rotation = "rotate(90deg)";
      }
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', rotation);
      }
      grp.commit();
    } else if (command.type == CommandType.mirrorHorizontal) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('mirrorHorizontal');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', 'scaleX(-1)');
      }
      grp.commit();
    } else if (command.type == CommandType.mirrorVertical) {
      const grp = designerCanvas.instanceServiceContainer.selectionService.primarySelection.openGroup('mirrorHorizontal');
      for (let s of designerCanvas.instanceServiceContainer.selectionService.selectedElements) {
        s.setStyle('transform', 'scaleY(-1)');
      }
      grp.commit();
    } else
      return null;

    designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(null);
    designerCanvas.instanceServiceContainer.selectionService.setSelectedElements(selection);
    return true;
  }
}

//TODO: combine transforms, could be easy, add new transform, get the matrix and convert back to simple ones (if possible)