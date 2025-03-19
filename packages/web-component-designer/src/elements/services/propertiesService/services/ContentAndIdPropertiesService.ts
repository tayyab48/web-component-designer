import { IProperty } from '../IProperty.js';
import { IDesignItem } from '../../../item/IDesignItem.js';
import { PropertyType } from '../PropertyType.js';
import { AbstractPropertiesService } from './AbstractPropertiesService.js';
import { RefreshMode } from '../IPropertiesService.js';
import { IPropertyGroup } from '../IPropertyGroup.js';
import { ValueType } from '../ValueType.js';
import { BindingTarget } from '../../../item/BindingTarget.js';

export class ContentAndIdPropertiesService extends AbstractPropertiesService {

  public override getRefreshMode(designItem: IDesignItem) {
    return RefreshMode.none;
  }

  public contentProperty: IProperty =
    {
      name: "textContent",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    };

  public idProperty: IProperty =
    {
      name: "id",
      type: "string",
      service: this,
      propertyType: PropertyType.propertyAndAttribute
    };

  public innerHtmlProperty: IProperty =
    {
      name: "innerHTML",
      type: "string",
      service: this,
      propertyType: PropertyType.property
    };

  public name = "content"

  override isHandledElement(designItem: IDesignItem): boolean {
    return true;
  }

  override async getProperty(designItem: IDesignItem, name: string): Promise<IProperty> {
    return name == 'id' ? this.idProperty : this.contentProperty;
  }

  override async getProperties(designItem: IDesignItem): Promise<IProperty[] | IPropertyGroup[]> {
    return [this.idProperty, this.contentProperty, this.innerHtmlProperty];
  }

  override clearValue(designItems: IDesignItem[], property: IProperty, clearType: 'all' | 'binding' | 'value' = 'all'): void {
    if (property.name == this.contentProperty.name || property.name == this.innerHtmlProperty.name) {
      const cg = designItems[0].openGroup("property cleared: " + property.name);
      for (let d of designItems) {
        if (clearType != 'binding') {
          d.clearChildren();
        }
        if (clearType != 'value') {
          d.serviceContainer.forSomeServicesTillResult('bindingService', (s) => {
            return s.clearBinding(d, property.name, this.getPropertyTarget(d, property));
          });
        }
        this._notifyChangedProperty(d, property, undefined);
      }
      cg.commit();
    } else {
      super.clearValue(designItems, property, clearType);
    }
  }

  override isSet(designItems: IDesignItem[], property: IProperty): ValueType {
    if (property.name == this.contentProperty.name || property.name == this.innerHtmlProperty.name) {
      let all = true;
      let some = false;
      if (designItems != null && designItems.length !== 0) {

        designItems.forEach((x) => {
          let has = false;
          has = x.element.childNodes.length > 0;
          all = all && has;
          some = some || has;
        });
        const bindings = AbstractPropertiesService.getOrBuildCachedBindings(designItems[0]);
        if (bindings && bindings.find(x => (x.target == BindingTarget.property || x.target == BindingTarget.explicitProperty) && x.targetName == property.name))
          return ValueType.bound;
      }
      return all ? ValueType.all : some ? ValueType.some : ValueType.none;
    }
    return super.isSet(designItems, property);
  }

  override getValue(designItems: IDesignItem[], property: IProperty): string | boolean {
    if (property.name == this.contentProperty.name || property.name == this.innerHtmlProperty.name) {
      return designItems[0].element.textContent;
    }
    return super.getValue(designItems, property);
  }
}
