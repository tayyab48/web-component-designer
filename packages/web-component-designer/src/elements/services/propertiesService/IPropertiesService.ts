import { IProperty } from './IProperty.js';
import { IService } from '../IService.js';
import { IDesignItem } from '../../item/IDesignItem.js';
import { ValueType } from './ValueType.js';
import { BindingTarget } from '../../item/BindingTarget.js';
import { IBinding } from '../../item/IBinding.js';
import { IPropertyGroup } from './IPropertyGroup.js';
import { IContextMenuItem } from '../../helper/contextMenu/IContextMenuItem.js';

export enum RefreshMode {
  none,
  full,
  fullOnValueChange,
  fullOnClassChange
}

export interface IPropertiesService extends IService {
  getRefreshMode(designItem: IDesignItem): RefreshMode;

  isHandledElement(designItem: IDesignItem): boolean;
  getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]>;
  getProperty(designItem: IDesignItem, name: string): Promise<IProperty>;
  getBinding(designItems: IDesignItem[], property: IProperty): IBinding
  getPropertyTarget(designItem: IDesignItem, property: IProperty): BindingTarget;

  setValue(designItems: IDesignItem[], property: IProperty, value: any) : Promise<void>;
  clearValue(designItems: IDesignItem[], property: IProperty, clearType: 'all' | 'binding' | 'value');
  isSet(designItems: IDesignItem[], property: IProperty): ValueType;
  getValue(designItems: IDesignItem[], property: IProperty): any;
  getUnsetValue(designItems: IDesignItem[], property: IProperty): any;

  getContextMenu(designItems: IDesignItem[], property: IProperty): IContextMenuItem[];
}
