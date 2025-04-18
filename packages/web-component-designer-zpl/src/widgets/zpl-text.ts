import { BaseCustomWebComponentConstructorAppend, css, html } from "@node-projects/base-custom-webcomponent";
import { getZplCoordinates } from "../zplHelper.js";

enum FontNames {
    Default_Font_0 = "0",
    Default_Font_1 = "A",
    Default_Font_Utf8 = "B"
}

enum TextRotations {
    Normal = "N",
    Rotated = "R",
    Inverted = "I",
    BottomUp = "B"
}

export class ZplText extends BaseCustomWebComponentConstructorAppend {

    static override readonly style = css`
    *{
        box-sizing: border-box;
    }
    `;

    static override readonly template = html`
    <div id="text-div" style="width: 100%; height: 100%; pointer-events: none">
    </div>
    `;

    static readonly is = 'zpl-text';

    public content: string;
    public fontName: string;
    public fontHeight: number;
    public fontWidth: number;
    public rotation: string;

    private _text: HTMLDivElement;

    static readonly properties = {
        content: String,
        fontName: FontNames,
        fontHeight: Number,
        fontWidth: Number,
        rotation: TextRotations
    }

    constructor() {
        super();
        this._restoreCachedInititalValues();
        this._text = this._getDomElement<HTMLDivElement>("text-div");
    }

    async ready() {
        this._parseAttributesToProperties();
        this._text.innerHTML = this.content;
        this._text.style.transformOrigin = "0 0";

        switch (this.fontName) {
            case FontNames.Default_Font_0:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "RobotoCn, Verdana";
                this._text.style.fontKerning = "none";
                this._text.style.transform = "scaleX(" + this.fontWidth / 9 + ") scaleY(" + this.fontHeight / 9 + ") translate(0px, -3px)";
                break;
            case FontNames.Default_Font_1:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "monospace";
                this._text.style.transform = "scaleX(" + this.fontWidth / 5 + ") scaleY(" + this.fontHeight / 8 + ") translate(0px, -3px)";
                break;
            case FontNames.Default_Font_Utf8:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "RobotoCn, Verdana";
                this._text.style.fontKerning = "none";
                this._text.style.transform = "scaleX(" + this.fontWidth / 9 + ") scaleY(" + this.fontHeight / 9 + ") translate(0px, -3px)";
                break;
        }

        if (this.rotation) {
            this.createTransform(this.rotation, this._text);
        }

        this.style.width = '';
        this.style.height = '';
        requestAnimationFrame(() => {
            let rect = this._text.getBoundingClientRect()
            this.style.width = rect.width + 'px';
            this.style.height = rect.height / 2 + 'px';
        });
    }

    public createZpl() {
        let zpl = "";
        zpl += getZplCoordinates(this, 0);
        zpl += this.buildZplFontCommand();
        zpl += "^FD" + this.content
        zpl += "^FS";
        return zpl;
    }

    private buildZplFontCommand(): string {
        let currentRotation = this.rotation || 'N';
        switch (this.fontName) {
            case FontNames.Default_Font_Utf8:
                return `^CI28^A0${currentRotation},${this.fontHeight},${this.fontWidth}`;
            default:
                return `^A${this.fontName}${currentRotation},${this.fontHeight},${this.fontWidth}`;
        }
    }

    private createTransform(rotation: string, el: HTMLElement) {
        switch (rotation) {
            case 'R':
                el.style.transform += ' rotate(90deg) translateY(-100%)';
                el.style.transformOrigin = '0% 0%';
                break;
            case 'I':
                el.style.transform += ' rotate(180deg)';
                el.style.transformOrigin = '50% 50%';
                break;
            case 'B':
                el.style.transform += ' rotate(270deg)';
                el.style.transformOrigin = '100% 100%';
                break;
            default:
                break;
        }
    }
    
    
}

customElements.define(ZplText.is, ZplText);