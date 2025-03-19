import { DesignItem } from '../../../item/DesignItem.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { NodeType } from "../../../item/NodeType.js";
import { ISelectionChangedEvent } from '../../../services/selectionService/ISelectionChangedEvent.js';
import { IDesignerCanvas } from '../IDesignerCanvas.js';
import { ExtensionType } from './ExtensionType.js';
import { IExtensionManager } from './IExtensionManger.js';
import { IDesignerExtension } from './IDesignerExtension.js';
import { IContentChanged } from '../../../services/contentService/IContentChanged.js';
import { DesignerCanvas } from '../designerCanvas.js';
import { ISelectionRefreshEvent } from '../../../services/selectionService/ISelectionRefreshEvent.js';
import { IDesignerExtensionProvider } from './IDesignerExtensionProvider.js';
import { clearCache as clearBoxQuadsCache, useCache as useBoxQuadsCache} from '../../../helper/getBoxQuads.js';

function wmGet<T extends Map<any, any>>(designItem: IDesignItem, weakMap: WeakMap<IDesignItem, T>) {
  let val = weakMap.get(designItem);
  if (val) return val;
  val = <any>new Map<any, any>();
  weakMap.set(designItem, val);
  return val;
}

export class ExtensionManager implements IExtensionManager {

  designerCanvas: IDesignerCanvas;
  designItemsWithExtentions: Set<IDesignItem> = new Set();
  _timeout: ReturnType<typeof setTimeout>;

  _appliedDesignerExtensions = new WeakMap<IDesignItem, Map<ExtensionType, IDesignerExtension[]>>
  _shouldAppliedDesignerExtensions = new WeakMap<IDesignItem, Map<ExtensionType, IDesignerExtensionProvider[]>>
  _lastApplyEventPerType = new WeakMap<IDesignItem, Map<ExtensionType, Event>>
  _lastPrimarySelectionRefreshItem: WeakRef<IDesignItem>

  constructor(designerCanvas: IDesignerCanvas) {
    useBoxQuadsCache();

    this.designerCanvas = designerCanvas;

    designerCanvas.instanceServiceContainer.selectionService.onSelectionChanged.on(this._selectedElementsChanged.bind(this));
    designerCanvas.instanceServiceContainer.selectionService.onSelectionRefresh.on(this._selectedElementsRefresh.bind(this));
    designerCanvas.instanceServiceContainer.contentService.onContentChanged.on(this._contentChanged.bind(this));

    designerCanvas.serviceContainer.globalContext.onToolChanged.on(() => {
      this.removeExtension(designerCanvas.instanceServiceContainer.selectionService.primarySelection, ExtensionType.PrimarySelectionRefreshed);
      this._lastPrimarySelectionRefreshItem = null;
    });
  }

  connected() {
    if (!this._timeout)
      this._timeout = setTimeout(() => this.refreshAllExtensionsTimeout(), 20);
  }

  disconnected() {
    if (this._timeout)
      clearTimeout(this._timeout);
    this._timeout = null;
  }



  private refreshAllExtensionsTimeout() {
    this.refreshAllAppliedExtentions();
    this._timeout = setTimeout(() => this.refreshAllExtensionsTimeout(), 20);
  }

  private _contentChanged(contentChanged: IContentChanged) {
    requestAnimationFrame(() => {
      switch (contentChanged.changeType) {
        case 'added':
          this.applyExtensions(contentChanged.designItems, ExtensionType.Permanent, null, true);
          break;
        case 'moved':
          this.refreshExtensions(contentChanged.designItems, ExtensionType.Permanent);
          break;
        case 'parsed':
          this.applyExtensions(Array.from(this.designerCanvas.rootDesignItem.children()), ExtensionType.Permanent, null, true);
          break;
        case 'removed':
          this.removeExtensions(contentChanged.designItems, true, ExtensionType.Permanent);
          break;
      }
    });
  }

  private _selectedElementsChanged(selectionChangedEvent: ISelectionChangedEvent) {
    this._lastPrimarySelectionRefreshItem = null;

    if (selectionChangedEvent.oldSelectedElements && selectionChangedEvent.oldSelectedElements.length) {
      this.removeExtension(selectionChangedEvent.oldSelectedElements[0], ExtensionType.PrimarySelectionRefreshed);
      this.removeExtension(selectionChangedEvent.oldSelectedElements[0], ExtensionType.PrimarySelection);
      this.removeExtension(selectionChangedEvent.oldSelectedElements[0], ExtensionType.PrimarySelectionAndCanBeEntered);
      this.removeExtension(selectionChangedEvent.oldSelectedElements[0], ExtensionType.OnlyOneItemSelected);
      this.removeExtensions(selectionChangedEvent.oldSelectedElements, false, ExtensionType.Selection);
      this.removeExtensions(selectionChangedEvent.oldSelectedElements, false, ExtensionType.MultipleItemsSelected);
      if (selectionChangedEvent.oldSelectedElements[0].parent) {
        const primaryContainer = DesignItem.GetOrCreateDesignItem(selectionChangedEvent.oldSelectedElements[0].parent.element, selectionChangedEvent.oldSelectedElements[0].parent.element, this.designerCanvas.serviceContainer, this.designerCanvas.instanceServiceContainer)
        this.removeExtension(primaryContainer, ExtensionType.PrimarySelectionContainer);
        this.removeExtension(primaryContainer, ExtensionType.PrimarySelectionContainerAndCanBeEntered);
      }
    }

    if (selectionChangedEvent.selectedElements && selectionChangedEvent.selectedElements.length) {
      this.applyExtensions(selectionChangedEvent.selectedElements, ExtensionType.Selection, selectionChangedEvent.event);
      this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.PrimarySelection, selectionChangedEvent.event);
      if (selectionChangedEvent.selectedElements.length === 1)
        this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.OnlyOneItemSelected, selectionChangedEvent.event);
      else if (selectionChangedEvent.selectedElements.length > 1)
        this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.MultipleItemsSelected, selectionChangedEvent.event);
      if (selectionChangedEvent.selectedElements[0].getPlacementService()?.isEnterableContainer(selectionChangedEvent.selectedElements[0]))
        this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.PrimarySelectionAndCanBeEntered, selectionChangedEvent.event);
      if (selectionChangedEvent.selectedElements[0].parent) {
        const primaryContainer = DesignItem.GetOrCreateDesignItem(selectionChangedEvent.selectedElements[0].parent.element, selectionChangedEvent.selectedElements[0].parent.element, this.designerCanvas.serviceContainer, this.designerCanvas.instanceServiceContainer)
        this.applyExtension(primaryContainer, ExtensionType.PrimarySelectionContainer, selectionChangedEvent.event);
        if (primaryContainer.getPlacementService()?.isEnterableContainer(primaryContainer))
          this.applyExtension(primaryContainer, ExtensionType.PrimarySelectionContainerAndCanBeEntered, selectionChangedEvent.event);
      }
    }
  }

  private _selectedElementsRefresh(selectionChangedEvent: ISelectionRefreshEvent) {
    this.refreshAllAppliedExtentions(selectionChangedEvent.event);

    if (selectionChangedEvent.selectedElements && selectionChangedEvent.selectedElements.length && this._lastPrimarySelectionRefreshItem?.deref() === selectionChangedEvent.selectedElements[0]) {
      if (!this._appliedDesignerExtensions.get(selectionChangedEvent.selectedElements[0])?.get(ExtensionType.PrimarySelectionRefreshed))
        this.applyExtension(selectionChangedEvent.selectedElements[0], ExtensionType.PrimarySelectionRefreshed, selectionChangedEvent.event);
    }
    this._lastPrimarySelectionRefreshItem = new WeakRef(selectionChangedEvent.selectedElements[0]);
  }

  applyExtension(designItem: IDesignItem, extensionType: ExtensionType, event?: Event, recursive: boolean = false) {
    if (designItem && designItem.nodeType == NodeType.Element) {
      const extProv = this.designerCanvas.serviceContainer.designerExtensions.get(extensionType);
      let extensions: IDesignerExtension[] = [];
      if (extProv) {
        const cache = {};
        clearBoxQuadsCache();
        for (let e of extProv) {
          let shouldAppE = wmGet(designItem, this._shouldAppliedDesignerExtensions).get(extensionType);
          if (!shouldAppE)
            shouldAppE = [];
          shouldAppE.push(e);
          wmGet(designItem, this._shouldAppliedDesignerExtensions).set(extensionType, shouldAppE);

          if (e.shouldExtend(this, this.designerCanvas, designItem)) {
            let appE = wmGet(designItem, this._appliedDesignerExtensions).get(extensionType);
            if (!appE)
              appE = [];
            const ext = e.getExtension(this, this.designerCanvas, designItem);
            try {
              ext.extend(cache, event);
              extensions.push(ext);
              if (event)
                wmGet(designItem, this._lastApplyEventPerType).set(extensionType, event);
              else wmGet(designItem, this._lastApplyEventPerType).delete(extensionType);
            }
            catch (err) {
              console.error(err);
            }
            appE.push(ext);
            wmGet(designItem, this._appliedDesignerExtensions).set(extensionType, appE);

            this.designItemsWithExtentions.add(designItem);
          }
        }
      }

      if (recursive) {
        for (const d of designItem.children()) {
          this.applyExtension(d, extensionType, event, recursive);
        }
      }
      return extensions;
    }
    return null;
  }

  applyExtensions(designItems: IDesignItem[], extensionType: ExtensionType, event?: Event, recursive: boolean = false) {
    this.designerCanvas.overlayLayer.startBatch();
    if (designItems) {
      const extProv = this.designerCanvas.serviceContainer.designerExtensions.get(extensionType);
      if (extProv) {
        const cache = {};
        clearBoxQuadsCache();
        for (let e of extProv) {
          for (let i of designItems) {
            let shouldAppE = wmGet(i, this._shouldAppliedDesignerExtensions).get(extensionType);
            if (!shouldAppE)
              shouldAppE = [];
            shouldAppE.push(e);
            wmGet(i, this._shouldAppliedDesignerExtensions).set(extensionType, shouldAppE);

            if (e.shouldExtend(this, this.designerCanvas, i)) {
              let appE = wmGet(i, this._appliedDesignerExtensions).get(extensionType);
              if (!appE)
                appE = [];
              const ext = e.getExtension(this, this.designerCanvas, i);
              try {
                ext.extend(cache, event);
                if (event)
                  wmGet(i, this._lastApplyEventPerType).set(extensionType, event);
                else wmGet(i, this._lastApplyEventPerType).delete(extensionType);
              }
              catch (err) {
                console.error(err);
              }
              appE.push(ext);
              wmGet(i, this._appliedDesignerExtensions).set(extensionType, appE);
              this.designItemsWithExtentions.add(i);
            }
          }
        }
      }

      if (recursive) {
        for (const d of designItems) {
          this.applyExtensions(Array.from(d.children()), extensionType, event, recursive);
        }
      }
    }
    this.designerCanvas.overlayLayer.endBatch();
  }

  applyExtensionInstance(designItem: IDesignItem, extension: IDesignerExtension) {
    let appE = wmGet(designItem, this._appliedDesignerExtensions).get(ExtensionType.Directly);
    if (!appE)
      appE = [];
    try {
      extension.extend(null, null);
    }
    catch (err) {
      console.error(err);
    }
    appE.push(extension);
    wmGet(designItem, this._appliedDesignerExtensions).set(ExtensionType.Directly, appE);
    this.designItemsWithExtentions.add(designItem);
  }

  removeExtensionInstance(designItem: IDesignItem, extension: IDesignerExtension) {
    for (let e of wmGet(designItem, this._appliedDesignerExtensions)) {
      const idx = e[1].indexOf(extension);
      if (idx >= 0) {
        try {
          extension.dispose();
        }
        catch (err) {
          console.error(err);
        }
        e[1].splice(idx, 1);
        if (e[1].length == 0) {
          wmGet(designItem, this._appliedDesignerExtensions).delete(e[0]);
          wmGet(designItem, this._shouldAppliedDesignerExtensions).delete(e[0]);
        }
        if (!wmGet(designItem, this._appliedDesignerExtensions).size)
          this.designItemsWithExtentions.delete(designItem);
      }
    }
  }

  removeExtension(designItem: IDesignItem, extensionType?: ExtensionType) {
    if (designItem) {
      if (extensionType) {
        wmGet(designItem, this._shouldAppliedDesignerExtensions).delete(extensionType);

        let exts = wmGet(designItem, this._appliedDesignerExtensions).get(extensionType);
        if (exts) {
          for (let e of exts) {
            try {
              e.dispose();
              wmGet(designItem, this._lastApplyEventPerType).delete(extensionType);
            }
            catch (err) {
              console.error(err);
            }
          }
          wmGet(designItem, this._appliedDesignerExtensions).delete(extensionType);
          if (!wmGet(designItem, this._appliedDesignerExtensions).size)
            this.designItemsWithExtentions.delete(designItem);
        }
      } else {
        wmGet(designItem, this._shouldAppliedDesignerExtensions).clear();
        for (let appE of wmGet(designItem, this._appliedDesignerExtensions)) {
          for (let e of appE[1]) {
            try {
              e.dispose();
            }
            catch (err) {
              console.error(err);
            }
          }
        }
        wmGet(designItem, this._appliedDesignerExtensions).clear();
        this.designItemsWithExtentions.delete(designItem);
      }
    }
  }

  removeExtensions(designItems: IDesignItem[], recursive: boolean, extensionType?: ExtensionType) {
    if (designItems) {
      if (extensionType) {
        for (let i of designItems) {
          if (recursive && i.hasChildren) {
            this.removeExtensions([...i.children()], true, extensionType);
          }
          wmGet(i, this._shouldAppliedDesignerExtensions).delete(extensionType);
          let exts = wmGet(i, this._appliedDesignerExtensions).get(extensionType);
          if (exts) {
            for (let e of exts) {
              try {
                e.dispose();
                wmGet(i, this._lastApplyEventPerType).delete(extensionType);
              }
              catch (err) {
                console.error(err);
              }
            }
            wmGet(i, this._appliedDesignerExtensions).delete(extensionType);
            if (!wmGet(i, this._appliedDesignerExtensions).size)
              this.designItemsWithExtentions.delete(i);
          }
        }
      } else {
        for (let i of designItems) {
          if (recursive && i.hasChildren) {
            this.removeExtensions([...i.children()], true, extensionType);
          }
          wmGet(i, this._shouldAppliedDesignerExtensions).clear();
          for (let appE of wmGet(i, this._appliedDesignerExtensions)) {
            for (let e of appE[1]) {
              try {
                e.dispose();
              }
              catch (err) {
                console.error(err);
              }
            }
          }
          wmGet(i, this._appliedDesignerExtensions).clear();
          this.designItemsWithExtentions.delete(i);
        }
      }
    }
  }

  refreshExtension(designItem: IDesignItem, extensionType?: ExtensionType, event?: Event) {
    if (this.designerCanvas.checkVisibility && !this.designerCanvas.checkVisibility())
      return;
    if (designItem) {
      if (extensionType) {
        if (!designItem.element.isConnected) {
          this.removeExtension(designItem, extensionType);
        } else {
          let exts = wmGet(designItem, this._appliedDesignerExtensions).get(extensionType);
          if (exts) {
            const cache = {};
            clearBoxQuadsCache();
            for (let e of exts) {
              try {
                e.refresh(cache, event);
                if (event)
                  wmGet(designItem, this._lastApplyEventPerType).set(extensionType, event);
              }
              catch (err) {
                console.error(err);
              }
            }
          }
        }
      } else {
        const cache = {};
        clearBoxQuadsCache();
        for (let appE of wmGet(designItem, this._appliedDesignerExtensions)) {
          for (let e of appE[1]) {
            try {
              e.refresh(cache, event);
            }
            catch (err) {
              console.error(err);
            }
          }
        }
      }
    }
  }

  refreshExtensions(designItems: IDesignItem[], extensionType?: ExtensionType, event?: Event, ignoredExtension?: IDesignerExtension, timeout?: number) {
    if (this.designerCanvas.checkVisibility && !this.designerCanvas.checkVisibility())
      return;
    this.designerCanvas.overlayLayer.startBatch();
    const start = performance.now();
    if (designItems) {
      if (extensionType) {
        const cache = {};
        clearBoxQuadsCache();
        outer1:
        for (let i of designItems) {
          if (!i.element.isConnected) {
            this.removeExtension(i, extensionType);
          } else {
            let exts = wmGet(i, this._appliedDesignerExtensions).get(extensionType);
            if (exts) {
              for (let e of exts) {
                try {
                  if (e != ignoredExtension)
                    e.refresh(cache, event);
                  if (timeout) {
                    const end = performance.now();
                    if (end - start > timeout) {
                      console.warn("refreshExtensions() took too long, stopped refreshing");
                      break outer1;
                    }
                  }
                }
                catch (err) {
                  console.error(err);
                }
              }
            }
          }
        }
      } else {
        const cache = {};
        clearBoxQuadsCache();
        outer2:
        for (let i of designItems) {
          for (let appE of wmGet(i, this._appliedDesignerExtensions)) {
            for (let e of appE[1]) {
              try {
                if (e != ignoredExtension) {
                  e.refresh(cache, event);
                  if (event)
                    wmGet(i, this._lastApplyEventPerType).set(extensionType, event);
                  if (timeout) {
                    const end = performance.now();
                    if (end - start > timeout) {
                      console.warn("refreshExtensions() took too long, stopped refreshing");
                      break outer2;
                    }
                  }
                }
              }
              catch (err) {
                console.error(err);
              }
            }
          }
        }
      }
    }
    this.designerCanvas.overlayLayer.endBatch();
  }

  refreshAllExtensions(designItems: IDesignItem[], ignoredExtension?: IDesignerExtension, event?: Event) {
    this.designerCanvas.overlayLayer.startBatch();
    if (designItems) {
      this.refreshExtensions(designItems, ExtensionType.Directly, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.Permanent, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.Selection, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.PrimarySelection, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.PrimarySelectionContainer, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.MouseOver, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.OnlyOneItemSelected, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.MultipleItemsSelected, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.ContainerDragOverAndCanBeEntered, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.ContainerDrag, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.Doubleclick, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.Placement, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.PrimarySelectionAndCanBeEntered, event, ignoredExtension);
      this.refreshExtensions(designItems, ExtensionType.PrimarySelectionContainerAndCanBeEntered, event, ignoredExtension);
    }
    this.designerCanvas.overlayLayer.endBatch();
  }

  refreshAllAppliedExtentions(event?: Event) {
    (<DesignerCanvas>this.designerCanvas).fillCalculationrects();
    this.refreshAllExtensions([...this.designItemsWithExtentions], null, event)
  }

  //TODO: does not work with permanant, when not applied... maybe we need to do in another way
  //maybe store the "shouldAppliedExtensions??"
  reapplyAllAppliedExtentions(filterDesignItems?: IDesignItem[], enabledExtensionTypes?: ExtensionType[]) {
    this.designerCanvas.overlayLayer.startBatch();
    for (let d of ExtensionManager.getAllChildElements(this.designerCanvas.rootDesignItem)) {
      if (!filterDesignItems || filterDesignItems.includes(d)) {
        const keys = [...wmGet(d, this._shouldAppliedDesignerExtensions).keys()];
        for (let t of keys) {
          const evt = wmGet(d, this._lastApplyEventPerType).get(t);
          this.removeExtension(d, t);
          if (enabledExtensionTypes == null || enabledExtensionTypes.includes(t))
            this.applyExtension(d, t, evt);
        }
      }
    }
    this.designerCanvas.overlayLayer.endBatch();
  }

  private static *getAllChildElements(designItem: IDesignItem): IterableIterator<IDesignItem> {
    if (designItem.nodeType == NodeType.Element)
      yield designItem;
    if (designItem.hasChildren) {
      for (let c of designItem.children())
        for (let di of ExtensionManager.getAllChildElements(c))
          yield di;
    }
  }
}
