import { BaseCustomWebComponentLazyAppend, css, TypedEvent, DomHelper } from '@node-projects/base-custom-webcomponent';
import { IActivateable } from '../../interfaces/IActivateable.js';

export type DesignerTabControlIndexChangedEventArgs = { newIndex: number, oldIndex?: number, changedViaClick?: boolean };

export class DesignerTabControl extends BaseCustomWebComponentLazyAppend {

  private _selectedIndex: number = -1;

  //private _contentObserver: MutationObserver;
  private _panels: HTMLDivElement;
  private _headerDiv: HTMLDivElement;
  private _moreDiv: HTMLDivElement;
  private _moreContainer: HTMLDivElement;
  private _elementMap = new WeakMap<HTMLElement, HTMLDivElement>();
  private _firstConnect = true;

  static override readonly style = css`
        :host {
            height: 100%;
        }
        .outer {
            display: flex; 
            flex-direction: column; 
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        .header {
            display: inline-flex; 
            user-select: none;
            -webkit-user-select: none; 
            flex-direction: row; 
            cursor: pointer; 
            height: 30px;
            width: calc(100% - 30px);
            background-color: var(--dark-grey, #232733);
            overflow-x: auto;
            scrollbar-width: none;  /* Firefox */
        }
        .header-more {
            right: 0;
            top: 0;
            width: 30px;
            position: absolute;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: math;
        }
        .header-more:hover {
            background: var(--light-grey, #383f52);
        }
        .more-container {
            z-index: 1;
            user-select: none;
            -webkit-user-select: none;
            background-color: var(--dark-grey, #232733);
            right: 0;
            top: 30px;
            position: absolute;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            cursor: pointer;
        }
        .more-container .tab-header { 
            width: 100%;
        }
        .header::-webkit-scrollbar { 
            display: none;  /* Safari and Chrome */
        }
        .tab-header {
            height: 30px;
            font-family: Arial;
            display: flex;
            justify-content: center;
            align-items: center;                
            text-transform: uppercase;                
            box-sizing: content-box;                
            padding-left: 5px;
            padding-right: 5px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            letter-spacing: 1px;
            white-space: nowrap;
        }
        .tab-header:hover {
            background: var(--light-grey, #383f52);
        }
        .selected {
            background: var(--medium-grey, #2f3545);
            box-shadow: inset 0 3px 0 var(--highlight-pink, #e91e63);
        }
        .panels {
            z-index: 0;
            background: var(--medium-grey, #2f3545);
            height: calc(100% - 30px);
        }
        `;

  constructor() {
    super();


    /*this._contentObserver = new MutationObserver((mut) => {
      let refresh = false;
      for (let m of mut) {
        if (m.type != 'attributes' || m.attributeName == 'style')
          refresh = true;
      }
      if (refresh)
        this.refreshItems();
    });*/

    let outerDiv = document.createElement("div")
    outerDiv.className = 'outer';
    this.shadowRoot.appendChild(outerDiv);
    this._headerDiv = document.createElement("div")
    this._headerDiv.className = 'header';
    outerDiv.appendChild(this._headerDiv);

    this._moreDiv = document.createElement("div");
    this._moreDiv.className = "header header-more"
    this._moreDiv.innerText = "≡"
    outerDiv.appendChild(this._moreDiv);
    this._moreContainer = document.createElement("div");
    this._moreContainer.className = "more-container";
    this._moreContainer.style.visibility = "hidden";
    outerDiv.appendChild(this._moreContainer);
    this._moreDiv.onclick = () => {
      if (this._moreContainer.children.length && this._moreContainer.style.visibility == "hidden")
        this._moreContainer.style.visibility = 'visible';
      else
        this._moreContainer.style.visibility = "hidden";
    }

    this._panels = document.createElement("div")
    this._panels.className = 'panels';
    outerDiv.appendChild(this._panels);
    let _slot = document.createElement("slot")
    _slot.name = 'panels';
    this._panels.appendChild(_slot);

    const resizeObserver = new ResizeObserver(entries => {
      this._showHideHeaderItems();
    });
    resizeObserver.observe(this._headerDiv);
  }

  private _showHideHeaderItems() {
    this._moreContainer.style.visibility = "hidden";
    let w = 0;
    DomHelper.removeAllChildnodes(this._moreContainer);
    DomHelper.removeAllChildnodes(this._headerDiv);
    let reloadOnce = true;
    for (let item of this.children) {
      if ((<HTMLElement>item).style.display != 'none') {
        let htmlItem = item as HTMLElement;
        if (!this._elementMap.has(htmlItem) && reloadOnce) {
          this.refreshItems();
          reloadOnce = false;
        }
        const tabHeaderDiv = this._elementMap.get(htmlItem);
        this._moreContainer.appendChild(tabHeaderDiv);
        if (this._headerDiv.children.length == 0 || (w + (tabHeaderDiv.clientWidth / 2)) < this._headerDiv.clientWidth) {
          this._headerDiv.appendChild(tabHeaderDiv);
          w += tabHeaderDiv.clientWidth;
        }
      }
    }
  }

  connectedCallback() {
    if (this._firstConnect) {
      this.refreshItems();
      this._firstConnect = false;

      //this._contentObserver.observe(this, { childList: true, subtree: true, attributes: true });

      let selectedIndexAttribute = this.getAttribute("selected-index")
      if (selectedIndexAttribute) {
        this.selectedIndex = parseInt(selectedIndexAttribute);
      }
    }
  }

  public get selectedIndex() {
    return this._firstConnect ? -1 : this._selectedIndex;
  }
  public set selectedIndex(value: number) {
    let old = this._selectedIndex;
    this._selectedIndex = value;
    if (this.children.length && old != this._selectedIndex)
      this._selectedIndexChanged(old);
  }

  public refreshItems() {
    this._headerDiv.innerHTML = "";
    let i = 0;
    for (let item of this.children) {
      if ((<HTMLElement>item).style.display != 'none') {
        let htmlItem = item as HTMLElement;
        let tabHeaderDiv = document.createElement("div")
        tabHeaderDiv.innerText = htmlItem.title;
        tabHeaderDiv.title = htmlItem.title;
        tabHeaderDiv.className = 'tab-header';
        let j = i;
        tabHeaderDiv.onpointerdown = () => {
          let old = this._selectedIndex;
          this._selectedIndex = j;
          if (this._headerDiv.children.length)
            this._selectedIndexChanged(old, true);
          this._moreContainer.style.visibility = 'hidden';
        }
        this._elementMap.set(htmlItem, tabHeaderDiv);
        this._headerDiv.appendChild(tabHeaderDiv);
        i++;
      }
    }

    this._showHideHeaderItems();
    this._selectedIndexChanged();
  }

  private _selectedIndexChanged(oldIndex?: number, viaClick = false) {
    let index = -1;
    for (let element of this.children) {
      if ((<HTMLElement>element).style.display != 'none') {
        index++;
        if (index == this._selectedIndex) {
          if (element.slot != "panels")
            element.slot = "panels";
          const headerEl = this._elementMap.get(<HTMLElement>element);
          if (headerEl) {
            headerEl.classList.add('selected');
            if ((<IActivateable><unknown>element).activated)
              (<IActivateable><unknown>element).activated();
          }
        } else {
          element.removeAttribute("slot");
          const headerEl = this._elementMap.get(<HTMLElement>element);
          if (headerEl) {
            headerEl.classList.remove('selected');
          }
        }
      }
    }
    this.onSelectedTabChanged.emit({ newIndex: this._selectedIndex, oldIndex: oldIndex, changedViaClick: viaClick });
    this._moreContainer.style.visibility = 'hidden';
  }

  public readonly onSelectedTabChanged = new TypedEvent<DesignerTabControlIndexChangedEventArgs>();
}

customElements.define('node-projects-designer-tab-control', DesignerTabControl);
