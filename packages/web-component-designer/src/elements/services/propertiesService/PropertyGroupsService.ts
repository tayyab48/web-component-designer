import { IDesignItem } from '../../item/IDesignItem.js';
import { NodeType } from '../../item/NodeType.js';
import { IPropertiesService } from './IPropertiesService.js';
import { IPropertyGroupsService } from './IPropertyGroupsService.js';
import { AttachedPropertiesService } from './services/AttachedPropertiesService.js';
import { AttributesPropertiesService } from './services/AttributesPropertiesService.js';
import { CommonPropertiesService } from './services/CommonPropertiesService.js';
import { CssCurrentPropertiesService } from './services/CssCurrentPropertiesService.js';
import { CssCustomPropertiesService } from './services/CssCustomPropertiesService.js';
import { CssPropertiesService } from './services/CssPropertiesService.js';

export class PropertyGroupsService implements IPropertyGroupsService {
    protected _attachedPropertiesService = new AttachedPropertiesService();

    protected _rootPgList: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'styles', propertiesService: new CssCurrentPropertiesService() },
        { name: 'css vars', propertiesService: new CssCustomPropertiesService() },
        { name: 'layout', propertiesService: new CssPropertiesService("layout") },
    ];

    protected _pgList: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'properties', propertiesService: null },
        { name: 'attached', propertiesService: this._attachedPropertiesService },
        { name: 'attributes', propertiesService: new AttributesPropertiesService() },
        { name: 'common', propertiesService: new CommonPropertiesService() },
        { name: 'styles', propertiesService: new CssCurrentPropertiesService() },
        { name: 'css vars', propertiesService: new CssCustomPropertiesService() },
        { name: 'layout', propertiesService: new CssPropertiesService("layout") },
    ];

    protected _svgPgList: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'properties', propertiesService: null },
        { name: 'attached', propertiesService: this._attachedPropertiesService },
        { name: 'attributes', propertiesService: new AttributesPropertiesService() },
        { name: 'common', propertiesService: new CommonPropertiesService() },
        { name: 'styles', propertiesService: new CssCurrentPropertiesService() },
        { name: 'css vars', propertiesService: new CssCustomPropertiesService() },
        { name: 'layout', propertiesService: new CssPropertiesService("layout") },
        { name: 'svg', propertiesService: new CssPropertiesService("svg") },
    ];

    protected _gridChild: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'gridChild', propertiesService: new CssPropertiesService("gridChild") },
    ];

    protected _grid: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'grid', propertiesService: new CssPropertiesService("grid") },
    ];

    protected _flexChild: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'flexChild', propertiesService: new CssPropertiesService("flexChild") },
    ];

    protected _flex: { name: string; propertiesService: IPropertiesService; }[] = [
        { name: 'flex', propertiesService: new CssPropertiesService("flex") },
    ];

    getPropertygroups(designItems: IDesignItem[]): { name: string; propertiesService: IPropertiesService; }[] {
        if (designItems == null || designItems.length == 0)
            return [];
        if (designItems[0].nodeType == NodeType.TextNode || designItems[0].nodeType == NodeType.Comment)
            return [];
        if (designItems[0].isRootItem) {
            const style = designItems[0].getComputedStyle();
            let lst = this._rootPgList;
            if (style.display.includes('grid'))
                lst = [...lst, ...this._grid];
            else if (style.display.includes('flex'))
                lst = [...lst, ...this._flex];
            return lst;
        }

        this._pgList[0].propertiesService = designItems[0].serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(designItems[0]));
        this._svgPgList[0].propertiesService = designItems[0].serviceContainer.getLastServiceWhere('propertyService', x => x.isHandledElement(designItems[0]));

        let lst = this._pgList;
        if (designItems[0].element instanceof designItems[0].window.SVGElement)
            lst = this._svgPgList;

        const style = designItems[0].getComputedStyle();
        if (style.display.includes('grid'))
            lst = [...lst, ...this._grid];
        else if (style.display.includes('flex'))
            lst = [...lst, ...this._flex];

        if (designItems[0].parent) {
            const parentStyle = designItems[0].parent.getComputedStyle();
            if (parentStyle.display.includes('grid'))
                lst = [...lst, ...this._gridChild];
            else if (parentStyle.display.includes('flex'))
                lst = [...lst, ...this._flexChild];
        }
        return lst;
    }
}