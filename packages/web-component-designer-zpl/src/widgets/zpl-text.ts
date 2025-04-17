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

        const rotationDegrees = this.getRotationDegrees();

        switch (this.fontName) {
            case FontNames.Default_Font_0:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "RobotoCn, Verdana";
                this._text.style.fontKerning = "none";
                // this._text.style.transform = "scaleX(" + this.fontWidth / 9 + ") scaleY(" + this.fontHeight / 9 + ") translate(0px, -3px)";
                this._text.style.transform =
                    `rotate(${rotationDegrees}deg) scaleX(${this.fontWidth / 9}) scaleY(${this.fontHeight / 9}) translate(0px, -3px)`;
                break;
            case FontNames.Default_Font_1:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "monospace";
                this._text.style.transform = "scaleX(" + this.fontWidth / 5 + ") scaleY(" + this.fontHeight / 8 + ") translate(0px, -3px)";
                this._text.style.transform = `rotate(${rotationDegrees}deg) scaleX(${this.fontWidth / 5}) scaleY(${this.fontHeight / 8}) translate(0px, -3px)`;
                break;
            case FontNames.Default_Font_Utf8:
                this._text.style.fontSize = "9px";
                this._text.style.fontFamily = "RobotoCn, Verdana";
                this._text.style.fontKerning = "none";
                // this._text.style.transform = "scaleX(" + this.fontWidth / 9 + ") scaleY(" + this.fontHeight / 9 + ") translate(0px, -3px)";
                this._text.style.transform =
                    `rotate(${rotationDegrees}deg) scaleX(${this.fontWidth / 9}) scaleY(${this.fontHeight / 9}) translate(0px, -3px)`;
                break;
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
        const zplRotation = this.getZplRotationCode();

        switch (this.fontName) {
            case FontNames.Default_Font_Utf8:
                return `^CI28^A0${zplRotation},${this.fontHeight},${this.fontWidth}`;
            default:
                return `^A${this.fontName}${zplRotation},${this.fontHeight},${this.fontWidth}`;
        }
    }

    private getZplRotationCode(): string {
        switch ((this.rotation || '').toLowerCase()) {
            case "normal":
            case "0":
                return "N";
            case "90":
            case "rotated":
                return "R";
            case "180":
            case "inverted":
                return "I";
            case "270":
            case "bottom-up":
                return "B";
            default:
                return "N";
        }
    }

    private getRotationDegrees(): number {
        switch ((this.rotation || '').toLowerCase()) {
            case "90":
            case "r":
            case "rotated":
                return 90;
            case "180":
            case "i":
            case "inverted":
                return 180;
            case "270":
            case "b":
            case "bottom-up":
                return 270;
            default:
                return 0;
        }
    }
    
}

customElements.define(ZplText.is, ZplText);