import { css, html, BaseCustomWebComponentConstructorAppend, cssFromString } from '@node-projects/base-custom-webcomponent';
import { IElementDefinition, IElementsService, NamedTools, ServiceContainer, dragDropFormatNameElementDefinition } from '@node-projects/web-component-designer';

export class PaletteTreeView extends BaseCustomWebComponentConstructorAppend {
  private _treeDiv: HTMLTableElement;
  private _tree: Fancytree.Fancytree;
  private _filter: HTMLInputElement;

  static override readonly style = css`
      :host {
        display: block;
      }

      * {
          touch-action: none;
      }

      span.drag-source {
        border: 1px solid grey;
        border-radius: 3px;
        padding: 2px;
        background-color: silver;
      }

      span.fancytree-node.fancytree-drag-source {
        outline: 1px dotted grey;
      }
      span.fancytree-node.fancytree-drop-accept {
        outline: 1px dotted green;
      }
      span.fancytree-node.fancytree-drop-reject {
        outline: 1px dotted red;
      }
      #tree ul {
        border: none;
      }
      #tree ul:focus {
        outline: none;
      }
      span.fancytree-title {
        align-items: center;
        flex-direction: row;
        display: inline-flex;
      }
      td {
        white-space: nowrap;
      }
      td:nth-child(n+2) {
        text-align: center;
      }
      td > img {
        vertical-align: middle;
      }
    `;

  static override readonly template = html`
  <div style="height: 100%;">
    <input id="input" style="width: 100%; height: 25px; box-sizing: border-box;" placeholder="Filter..." autocomplete="off">
    <div style="height: calc(100% - 26px); overflow: auto;">
      <div id="treetable" style="min-width: 100%;"></div>
    </div>
  </div>`;

  public serviceContainer: ServiceContainer;

  constructor() {
    super();
    this._restoreCachedInititalValues();

    //@ts-ignore
    import("jquery.fancytree/dist/skin-win8/ui.fancytree.css", { with: { type: 'css' } }).then(x => this.shadowRoot.adoptedStyleSheets = [cssFromString(x), this.constructor.style]);

    this._filter = this._getDomElement<HTMLInputElement>('input');
    this._filter.onkeyup = () => {
      let match = this._filter.value;
      this._tree.filterNodes((node) => {
        return new RegExp(match, "i").test(node.title);
      })
    }

    this._treeDiv = this._getDomElement<HTMLTableElement>('treetable')

    $(this._treeDiv).fancytree(<Fancytree.FancytreeOptions>{
      debugLevel: 0,
      icon: true, //atm, maybe if we include icons for specific elements
      extensions: ['childcounter', 'dnd5', 'filter'],
      quicksearch: true,
      source: [],
      tooltip: true,

      filter: {
        autoExpand: true,
        mode: 'hide',
        highlight: true
      },

      click: (e, data) => {
        if (e.originalEvent) { // only for clicked items, not when elements selected via code.
          let node = data.node;
          let elDef: IElementDefinition = node.data.ref;
          if (elDef) {
            let tool = this.serviceContainer.designerTools.get(elDef.tool ?? NamedTools.DrawElementTool);
            if (typeof tool == 'function')
              tool = new tool(elDef)
            this.serviceContainer.globalContext.tool = tool;
          }
        }
        return true;
      },

      dnd5: {
        dropMarkerParent: this.shadowRoot,
        preventRecursion: true, // Prevent dropping nodes on own descendants
        preventVoidMoves: false,
        dropMarkerOffsetX: -24,
        dropMarkerInsertOffsetX: -16,

        dragStart: (node, data) => {
          data.effectAllowed = "all";
          data.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(node.data.ref));
          data.dropEffect = "copy";
          return true;
        },
        dragEnter: (node, data) => {
          return false;
        }
      }
    });

    //@ts-ignore
    this._tree = $.ui.fancytree.getTree(this._treeDiv);
    this._treeDiv.children[0].classList.add('fancytree-connectors');
  }

  public async loadControls(serviceContainer: ServiceContainer, elementsServices: IElementsService[]) {
    this.serviceContainer = serviceContainer;

    let rootNode = this._tree.getRootNode();
    rootNode.removeChildren();

    for (const s of elementsServices) {
      const newNode = rootNode.addChildren({
        title: s.name,
        folder: true
      });

      try {
        let elements = await s.getElements();
        for (let e of elements) {
          newNode.addChildren({
            title: e.name ?? e.tag,
            folder: false,
            //@ts-ignore
            ref: e
          });
        }
      } catch (err) {
        console.warn('Error loading elements', err);
      }


      try {
        //@ts-ignore
        newNode.updateCounters();
      }
      catch { }
    }
  }
}

customElements.define('node-projects-palette-tree-view', PaletteTreeView);