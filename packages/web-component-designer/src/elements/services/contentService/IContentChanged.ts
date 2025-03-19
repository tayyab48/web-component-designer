import { IDesignItem } from "../../item/IDesignItem.js";

interface IContentChangedParsed {
  changeType: 'parsed'
}

interface IContentChangedWithDesignItems {
  changeType: "added" | "removed" | "moved" | "changed"
  designItems: IDesignItem[];
}

export type IContentChanged = IContentChangedParsed | IContentChangedWithDesignItems;