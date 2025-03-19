import { css, html, BaseCustomWebComponentConstructorAppend } from '@node-projects/base-custom-webcomponent';
import { OverlayLayer } from './extensions/OverlayLayer.js';
import { ServiceContainer } from '../../services/ServiceContainer.js';

export class OverlayLayerView extends BaseCustomWebComponentConstructorAppend {

  static override readonly template = html`
    <svg id="svg" style="pointer-events: none;">
      <defs id="defs"></defs>
      <g id="background"></g>
      <g id="normal"></g>
      <g id="foreground"></g>
    </svg>`;


  static override readonly style = css`
    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .svg-invisible { stroke: transparent; fill: transparent; pointer-events: all; }
    .svg-snapline { stroke: purple; stroke-dasharray: 4; fill: transparent; }
    .svg-selector { stroke: black; fill: #3899ec55; stroke-width: 1; stroke-dasharray: 2; }
    .svg-primary-selection-move { stroke: #3899ec; fill: #3899ec; cursor: move; pointer-events: all; }
    .svg-position  { stroke: black; stroke-dasharray: 2; }
    .svg-path { stroke: #3899ec; fill: orange; pointer-events: all; }
    .svg-path-line { stroke: #3899ec; stroke-dasharray: 2; }
    .svg-draw-new-element { stroke: black; fill: transparent; stroke-width: 1; }
    .svg-toolbar-container { overflow: visible }
    .svg-toolbar-container > div { padding: 5px; display: flex; gap: 2px; background: white; border-radius: 4px; box-shadow: 0 2px 10px 0 rgba(19,23,32,.2); align-items: center; }
    
    node-projects-image-button-list-selector img {
      height: 16px;
      border: 1px solid black;
      border-radius: 4px;
      box-sizing: border-box;
      pointer-events: auto;
      cursor: pointer;
    }
    node-projects-image-button-list-selector img:hover {
      background: lightgray;
    }
    node-projects-image-button-list-selector img:active {
      translate: 1px 1px
    }
    `;

  static readonly is = 'node-projects-overlay-layer-view';

  private _serviceContainer: ServiceContainer;
  private _svg: SVGElement;
  private _gBackground: SVGGElement;
  private _gNormal: SVGGElement;
  private _gForeground: SVGGElement;
  private _defs: SVGDefsElement;
  private _id: number = 0;

  constructor(serviceContainer: ServiceContainer) {
    super();

    this._serviceContainer = serviceContainer;
    this._svg = this._getDomElement<SVGElement>('svg');
    this._gBackground = this._getDomElement<SVGGElement>('background');
    this._gNormal = this._getDomElement<SVGGElement>('normal');
    this._gForeground = this._getDomElement<SVGGElement>('foreground');
    this._defs = this._getDomElement<SVGDefsElement>('defs');

    this._initialize();
  }

  private _initialize() {
    const styles: CSSStyleSheet[] = [OverlayLayerView.style];
    const alreadyApplied = new Set();

    for (const extList of this._serviceContainer.designerExtensions) {
      for (const ext of extList[1]) {
        if (ext.constructor.style) {
          if (Array.isArray(ext.constructor.style)) {
            for (const s of ext.constructor.style) {
              if (!alreadyApplied.has(s)) {
                alreadyApplied.add(s);
                styles.push(s);
              }
            }
          } else
            if (!alreadyApplied.has(ext.constructor.style)) {
              alreadyApplied.add(ext.constructor.style);
              styles.push(ext.constructor.style);
            }
        }
        if (ext.style) {
          if (Array.isArray(ext.style)) {
            for (const s of ext.style) {
              if (!alreadyApplied.has(s)) {
                alreadyApplied.add(s);
                styles.push(s);
              }
            }
          } else
            if (!alreadyApplied.has(ext.style)) {
              alreadyApplied.add(ext.style);
              styles.push(ext.style);
            }
        }
        if (ext.svgDefs) {
          if (Array.isArray(ext.svgDefs)) {
            for (const s of ext.svgDefs) {
              if (!alreadyApplied.has(s)) {
                alreadyApplied.add(s);
                const a = document.createElementNS("http://www.w3.org/2000/svg", "defs")
                a.innerHTML = s;
                for (let n of [...a.children])
                  this._defs.appendChild(n);
              }
            }
          } else
            if (!alreadyApplied.has(ext.svgDefs)) {
              alreadyApplied.add(ext.svgDefs);
              const a = document.createElementNS("http://www.w3.org/2000/svg", "defs")
              a.innerHTML = ext.svgDefs;
              for (let n of [...a.children])
                this._defs.appendChild(n);
            }
        }
        if (ext.constructor.svgDefs) {
          if (Array.isArray(ext.constructor.svgDefs)) {
            for (const s of ext.constructor.svgDefs) {
              if (!alreadyApplied.has(s)) {
                alreadyApplied.add(s);
                const a = document.createElementNS("http://www.w3.org/2000/svg", "defs")
                a.innerHTML = s;
                for (let n of [...a.children])
                  this._defs.appendChild(n);
              }
            }
          } else
            if (!alreadyApplied.has(ext.constructor.svgDefs)) {
              alreadyApplied.add(ext.constructor.svgDefs);
              const a = document.createElementNS("http://www.w3.org/2000/svg", "defs")
              a.innerHTML = ext.constructor.svgDefs;
              for (let n of [...a.children])
                this._defs.appendChild(n);
            }
        }
      }
    }

    for (const ext of this._serviceContainer.designerPointerExtensions) {
      if (ext.style) {
        if (!alreadyApplied.has(ext.style)) {
          alreadyApplied.add(ext.style);
          styles.push(ext.style);
        }
      }
      if (ext.svgDefs) {
        if (!alreadyApplied.has(ext.svgDefs)) {
          alreadyApplied.add(ext.svgDefs);
          const a = document.createElementNS("http://www.w3.org/2000/svg", "defs")
          a.innerHTML = ext.svgDefs;
          for (let n of [...a.children])
            this._defs.appendChild(n);
        }
      }
    }

    this.shadowRoot.adoptedStyleSheets = styles;
  }

  backgroundFragment: DocumentFragment;
  foregroundFragment: DocumentFragment;
  normalFragment: DocumentFragment;
  batchCount = 0;

  public startBatch() {
    if (this.batchCount == 0) {
      this.backgroundFragment = document.createDocumentFragment();
      this.foregroundFragment = document.createDocumentFragment();
      this.normalFragment = document.createDocumentFragment();
    }
    this.batchCount++;
  }

  public endBatch() {
    this.batchCount--;
    if (this.batchCount == 0) {
      if (this.backgroundFragment.hasChildNodes)
        this._gBackground.appendChild(this.backgroundFragment);
      if (this.foregroundFragment.hasChildNodes)
        this._gForeground.appendChild(this.foregroundFragment);
      if (this.normalFragment.hasChildNodes)
        this._gNormal.appendChild(this.normalFragment);
      this.backgroundFragment = null;
      this.foregroundFragment = null;
      this.normalFragment = null;
    }
  }

  public addOverlay(overlaySource: string, element: SVGGraphicsElement, overlayLayer: OverlayLayer = OverlayLayer.Normal) {
    element.setAttribute("overlay-source", overlaySource);
    switch (overlayLayer) {
      case OverlayLayer.Background:
        if (this.backgroundFragment)
          this.backgroundFragment.appendChild(element);
        else
          this._gBackground.appendChild(element);
        break;
      case OverlayLayer.Foreground:
        if (this.foregroundFragment)
          this.foregroundFragment.appendChild(element);
        else
          this._gForeground.appendChild(element);
        break;
      default:
        if (this.normalFragment)
          this.normalFragment.appendChild(element);
        else
          this._gNormal.appendChild(element);
        break;
    }
  }

  public removeOverlay(element: SVGElement) {
    try {
      element?.parentElement?.removeChild(element);
    } catch (err) {
      console.error(err);
    }
  }

  public removeAllNodesWithClass(className: string) {
    const nodes = this._svg.querySelectorAll('.' + className);
    for (const e of nodes) {
      e.parentNode.removeChild(e);
    }
  }

  public removeAllOverlays() {
    const nodes = this._svg.querySelectorAll('svg > g > *');
    for (const e of nodes) {
      e.parentNode.removeChild(e);
    }
  }

  public createPoint(): DOMPointInit {
    //@ts-ignore
    return this._svg.createSVGPoint();
  }

  drawGroup(overlaySource: string, className?: string, group?: SVGGElement, overlayLayer?: OverlayLayer) {
    if (!group) {
      group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.addOverlay(overlaySource, group, overlayLayer);
    }
    if (className)
      group.setAttribute('class', className);
    return group;
  }

  drawLine(overlaySource: string, x1: number, y1: number, x2: number, y2: number, className?: string, line?: SVGLineElement, overlayLayer?: OverlayLayer) {
    if (!line) {
      line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      this.addOverlay(overlaySource, line, overlayLayer);
    }
    line.setAttribute('x1', <string><any>x1);
    line.setAttribute('y1', <string><any>y1);
    line.setAttribute('x2', <string><any>x2);
    line.setAttribute('y2', <string><any>y2);
    if (className)
      line.setAttribute('class', className);

    return line;
  }

  drawCircle(overlaySource: string, x: number, y: number, radius: number, className?: string, circle?: SVGCircleElement, overlayLayer?: OverlayLayer) {
    if (!circle) {
      circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      this.addOverlay(overlaySource, circle, overlayLayer);
    }
    circle.setAttribute('cx', <string><any>x);
    circle.setAttribute('cy', <string><any>y);
    circle.setAttribute('r', <string><any>radius);
    if (className)
      circle.setAttribute('class', className);
    return circle;
  }

  drawRect(overlaySource: string, x: number, y: number, w: number, h: number, className?: string, rect?: SVGRectElement, overlayLayer?: OverlayLayer) {
    if (!rect) {
      rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.addOverlay(overlaySource, rect, overlayLayer);
    }
    rect.setAttribute('x', <string><any>x);
    rect.setAttribute('y', <string><any>y);
    rect.setAttribute('width', <string><any>w);
    rect.setAttribute('height', <string><any>h);
    if (className)
      rect.setAttribute('class', className);
    return rect;
  }

  drawPath(overlaySource: string, data: string, className?: string, path?: SVGPathElement, overlayLayer?: OverlayLayer) {
    if (!path) {
      path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      this.addOverlay(overlaySource, path, overlayLayer);
    }
    path.setAttribute('d', data);
    if (className)
      path.setAttribute('class', className);
    return path;
  }

  drawText(overlaySource: string, text: string, x: number, y: number, className?: string, textEl?: SVGTextElement, overlayLayer?: OverlayLayer) {
    if (!textEl) {
      textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      this.addOverlay(overlaySource, textEl, overlayLayer);
    }
    textEl.setAttribute('x', <string><any>x);
    textEl.setAttribute('y', <string><any>y);
    textEl.textContent = text;
    if (className)
      textEl.setAttribute('class', className);
    return textEl;
  }

  drawHTML(overlaySource: string, html: HTMLElement | string, x: number, y: number, w: number, h: number, className?: string, htmlObj?: SVGForeignObjectElement, overlayLayer?: OverlayLayer) {
    if (!htmlObj) {
      htmlObj = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
      this.addOverlay(overlaySource, htmlObj, overlayLayer);
    }
    htmlObj.setAttribute('x', <string><any>x);
    htmlObj.setAttribute('y', <string><any>y);
    htmlObj.setAttribute('width', <string><any>w);
    htmlObj.setAttribute('height', <string><any>h);
    if (typeof html === 'string')
      htmlObj.innerHTML = html;
    else
      htmlObj.appendChild(html);
    if (className)
      htmlObj.setAttribute('class', className);
    return htmlObj;
  }

  drawTextWithBackground(overlaySource: string, text: string, x: number, y: number, backgroundColor: string, className?: string, existingEls?: [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement], overlayLayer?: OverlayLayer): [SVGFilterElement, SVGFEFloodElement, SVGTextElement, SVGTextElement] {
    if (!existingEls) {
      let filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
      filter.setAttribute("width", "1");
      filter.setAttribute("height", "1");
      filter.setAttribute("id", "solid_" + (++this._id));
      let flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
      flood.setAttribute("flood-color", backgroundColor);
      filter.appendChild(flood);
      let composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
      composite.setAttribute("in", "SourceGraphic");
      composite.setAttribute("operator", "xor");
      filter.appendChild(composite);
      this._defs.appendChild(filter);
      let textEl1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl1.setAttribute("filter", "url(#solid_" + this._id + ")");
      let textEl2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
      this.addOverlay(overlaySource, textEl1, overlayLayer);
      this.addOverlay(overlaySource, textEl2, overlayLayer);
      filter.setAttribute("overlay-source", overlaySource);
      flood.setAttribute("overlay-source", overlaySource);
      existingEls = [filter, flood, textEl1, textEl2]
    }
    existingEls[2].setAttribute('x', <string><any>x);
    existingEls[3].setAttribute('x', <string><any>x);
    existingEls[2].setAttribute('y', <string><any>y);
    existingEls[3].setAttribute('y', <string><any>y);
    existingEls[2].textContent = text;
    existingEls[3].textContent = text;
    if (className) {
      existingEls[2].setAttribute('class', className);
      existingEls[3].setAttribute('class', className);
    }
    return existingEls;
  }
}

customElements.define(OverlayLayerView.is, OverlayLayerView);