import { EventNames } from '../../../../../enums/EventNames.js';
import { IPoint } from '../../../../../interfaces/IPoint.js';
import { IRect } from '../../../../../interfaces/IRect.js';
import { IDesignItem } from '../../../../item/IDesignItem.js';
import { IDesignerCanvas } from '../../IDesignerCanvas.js';
import { AbstractExtension } from '../AbstractExtension.js';
import { IExtensionManager } from '../IExtensionManger.js';


export class RectExtension extends AbstractExtension {
    private _parentRect: DOMRect;
    private _rectElement: SVGRectElement;
    private _circlePos: IPoint;
    private _startPos: IPoint;
    private _lastPos: IPoint;
    private _originalPoint: IPoint;
    private _x: number;
    private _y: number;
    private _w: number;
    private _h: number;
    private _circle1: SVGCircleElement;
    private _circle2: SVGCircleElement;
    private _circle3: SVGCircleElement;
    private _circle4: SVGCircleElement;
    private _startScrollOffset: IPoint;
    private _deltaScrollOffset: IPoint;
    private _rect = { x: 0, y: 0, w: 0, h: 0 }
    private _parentCoordinates: IRect;
    private _offsetSvg = 10.0;
    private _circleMoved: boolean;


    constructor(extensionManager: IExtensionManager, designerView: IDesignerCanvas, extendedItem: IDesignItem) {
        super(extensionManager, designerView, extendedItem);
    }

    override extend() {
        this.refresh();
    }

    override refresh() {
        this._parentRect = (<SVGGeometryElement>this.extendedItem.element).parentElement.getBoundingClientRect();
        this._rectElement = (<SVGRectElement>this.extendedItem.node);
        this._startScrollOffset = this.designerCanvas.canvasOffset;

        this._x = this._rectElement.x.baseVal.value;
        this._y = this._rectElement.y.baseVal.value;
        this._w = this._rectElement.width.baseVal.value;
        this._h = this._rectElement.height.baseVal.value;

        if (this._valuesHaveChanges(this.designerCanvas.zoomFactor, this._x, this._y, this._w, this._h)) {
            this._circle1 = this._drawPathCircle(this._x, this._y, this._rectElement, 0, this._circle1);
            this._circle2 = this._drawPathCircle(this._x + this._w, this._y, this._rectElement, 1, this._circle2);
            this._circle3 = this._drawPathCircle(this._x + this._w, this._y + this._h, this._rectElement, 2, this._circle3);
            this._circle4 = this._drawPathCircle(this._x, this._y + this._h, this._rectElement, 3, this._circle4);
        }
    }

    pointerEvent(event: PointerEvent, circle: SVGCircleElement, r: SVGRectElement, index: number) {
        event.stopPropagation();
        const cursorPos = this.designerCanvas.getNormalizedEventCoordinates(event);

        switch (event.type) {
            case EventNames.PointerDown:
                (<Element>event.target).setPointerCapture(event.pointerId);
                this._startPos = cursorPos;
                this._circlePos = { x: parseFloat(circle.getAttribute("cx")), y: parseFloat(circle.getAttribute("cy")) }
                this._originalPoint = { x: this._x, y: this._y }
                this._parentCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._rectElement.parentElement);
                break;

            case EventNames.PointerMove:
                if (this._startPos && event.buttons > 0) {
                    this._deltaScrollOffset = {
                        x: this._startScrollOffset.x - this.designerCanvas.canvasOffset.x,
                        y: this._startScrollOffset.y - this.designerCanvas.canvasOffset.y
                    }
                    this._lastPos = { x: this._startPos.x, y: this._startPos.y };
                    const cx = cursorPos.x - this._lastPos.x + this._circlePos.x;
                    const cy = cursorPos.y - this._lastPos.y + this._circlePos.y;
                    let dx = cx - this._circlePos.x;
                    let dy = cy - this._circlePos.y;
                    if (dx != 0 || dy != 0)
                        this._circleMoved = true;
                    if (event.shiftKey) {
                        if (Math.abs(dx) < Math.abs(dy)) {
                            dx = 0;
                        } else {
                            dy = 0;
                        }
                    }
                    switch (index) {
                        case 0:
                            this._rect = this._calculateRect(
                                this._originalPoint.x + dx,
                                this._originalPoint.y + dy,
                                this._w - dx,
                                this._h - dy);

                            break;

                        case 1:
                            this._rect = this._calculateRect(
                                this._originalPoint.x,
                                this._originalPoint.y + dy,
                                this._w + dx,
                                this._h - dy);
                            break;

                        case 2:
                            this._rect = this._calculateRect(
                                this._originalPoint.x,
                                this._originalPoint.y,
                                this._w + dx,
                                this._h + dy);
                            break;

                        case 3:
                            this._rect = this._calculateRect(
                                this._originalPoint.x + dx,
                                this._originalPoint.y,
                                this._w - dx,
                                this._h + dy);
                            break;
                    }
                    r.setAttribute("x", this._rect.x.toString());
                    r.setAttribute("y", this._rect.y.toString());
                    r.setAttribute("width", this._rect.w.toString());
                    r.setAttribute("height", this._rect.h.toString());
                    circle.setAttribute("cx", (this._circlePos.x + dx).toString());
                    circle.setAttribute("cy", (this._circlePos.y + dy).toString());

                    this.designerCanvas.extensionManager.refreshAllExtensions([this.extendedItem], this);

                    this._redrawPathCircle(this._rect.x, this._rect.y, this._circle1);
                    this._redrawPathCircle(this._rect.x + this._rect.w, this._rect.y, this._circle2);
                    this._redrawPathCircle(this._rect.x + this._rect.w, this._rect.y + this._rect.h, this._circle3);
                    this._redrawPathCircle(this._rect.x, this._rect.y + this._rect.h, this._circle4);
                }

                break;

            case EventNames.PointerUp:
                (<Element>event.target).releasePointerCapture(event.pointerId);
                this._startPos = null;
                this._circlePos = null;
                this._originalPoint = null;
                if (this._circleMoved) {
                    this.extendedItem.setAttribute("x", this._rect.x.toString());
                    this.extendedItem.setAttribute("y", this._rect.y.toString());
                    this.extendedItem.setAttribute("width", this._rect.w.toString());
                    this.extendedItem.setAttribute("height", this._rect.h.toString());
                }
                if (getComputedStyle(this._rectElement.parentElement).position == "absolute") {
                    let group = this.extendedItem.openGroup('rearrangeSvg');
                    let newRectCoordinates = this.designerCanvas.getNormalizedElementCoordinates(this._rectElement);
                    let newRectCoordinatesCloud = this._getPointsFromRect(newRectCoordinates);
                    let newRectExtrema = this._getMinMaxValues(newRectCoordinatesCloud);
                    this._rearrangeSvgParent(newRectExtrema);
                    this._rearrangePointsFromElement(this._parentCoordinates);
                    group.commit();
                }
                break;
        }
    }

    _drawPathCircle(x: number, y: number, r: SVGRectElement, index: number, circle: SVGCircleElement) {
        let newCircle = this._drawCircle(
            (this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x,
            (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y,
            5 / this.designerCanvas.scaleFactor,
            'svg-path', circle);
        newCircle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();

        if (!circle) {
            newCircle.addEventListener(EventNames.PointerDown, event => this.pointerEvent(event, newCircle, r, index));
            newCircle.addEventListener(EventNames.PointerMove, event => this.pointerEvent(event, newCircle, r, index));
            newCircle.addEventListener(EventNames.PointerUp, event => this.pointerEvent(event, newCircle, r, index));
        }
        return newCircle;
    }

    _redrawPathCircle(x: number, y: number, oldCircle: SVGCircleElement) {
        let circle = this._drawCircle(
            (this._parentRect.x - this.designerCanvas.containerBoundingRect.x) / this.designerCanvas.scaleFactor + x - this._deltaScrollOffset.x,
            (this._parentRect.y - this.designerCanvas.containerBoundingRect.y) / this.designerCanvas.scaleFactor + y - this._deltaScrollOffset.y,
            5 / this.designerCanvas.scaleFactor,
            'svg-path',
            oldCircle);
        circle.style.strokeWidth = (1 / this.designerCanvas.zoomFactor).toString();
        return circle;
    }

    _calculateRect(x: number, y: number, w: number, h: number) {
        let rect = { x: 0, y: 0, w: 0, h: 0 }
        if (w >= 0) {
            rect.x = x;
            rect.w = w;
        } else {
            rect.x = x + w
            rect.w = -w;
        }
        if (h >= 0) {
            rect.y = y;
            rect.h = h;
        } else {
            rect.y = y + h;
            rect.h = -h
        }
        return rect;
    }

    _getPointsFromRect(elementCoords: IRect) {
        let Coords: number[] = [];
        Coords.push(elementCoords.x);
        Coords.push(elementCoords.x + elementCoords.width);
        Coords.push(elementCoords.x);
        Coords.push(elementCoords.x + elementCoords.width);
        Coords.push(elementCoords.y);
        Coords.push(elementCoords.y);
        Coords.push(elementCoords.y + elementCoords.height);
        Coords.push(elementCoords.y + elementCoords.height);
        Coords.push(elementCoords.height);
        Coords.push(elementCoords.width);
        return Coords;
    }

    _getMinMaxValues(coords) {
        let extrema = { xMin: 0.0, xMax: 0.0, yMin: 0.0, yMax: 0.0 };
        for (let i = 0; i < coords.length - 2; i++) {
            if (coords[i] < coords[i + 1] && i <= 3) {
                extrema.xMin = coords[i];
            } else if (coords[i] < coords[i + 1] && i > 3 && i <= 7) {
                extrema.yMin = coords[i];
            }
            if (coords[i] > coords[i + 1] && i <= 3) {
                extrema.xMax = coords[i];
            } else if (coords[i] > coords[i + 1] && i > 3 && i <= 8) {
                extrema.yMax = coords[i];
            }
        }
        return extrema;
    }

    _rearrangeSvgParent(newRectExtrema) {
        let parentLeft = newRectExtrema.xMin - this._offsetSvg;
        let parentTop = newRectExtrema.yMin - this._offsetSvg;
        let widthRectElement = newRectExtrema.xMax - newRectExtrema.xMin + (2 * this._offsetSvg);
        let heightRectElement = newRectExtrema.yMax - newRectExtrema.yMin + (2 * this._offsetSvg);
        this.extendedItem.parent.setStyle("left", parentLeft.toString() + "px");
        this.extendedItem.parent.setStyle("top", parentTop.toString() + "px");
        this.extendedItem.parent.setStyle("height", Math.round(heightRectElement).toString() + "px");
        this.extendedItem.parent.setStyle("width", Math.round(widthRectElement).toString() + "px");
    }

    _rearrangePointsFromElement(oldParentCoords: IRect) {
        let newParentCoords = this.designerCanvas.getNormalizedElementCoordinates(this._rectElement.parentElement);
        let diffX = oldParentCoords.x - newParentCoords.x;
        let diffY = oldParentCoords.y - newParentCoords.y;
        this.extendedItem.setAttribute('x', (this._rectElement.x.baseVal.value + diffX).toString());
        this.extendedItem.setAttribute('y', (this._rectElement.y.baseVal.value + diffY).toString());
    }

    override dispose() {
        this._removeAllOverlays();
    }

}