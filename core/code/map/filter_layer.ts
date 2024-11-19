/* eslint-disable guard-for-in */
/* eslint-disable max-classes-per-file */

import { IITCr } from "../IITC";

type FilterFctPortal = (portal: IITC.Portal) => boolean;
type FilterFctLink = (link: IITC.Link) => boolean;
type FilterFctField = (link: IITC.Field) => boolean;


interface FilterLayerOptions extends L.LayerOptions {
    filterPortal?: FilterFctPortal;
    filterLink?: FilterFctLink;
    filterField?: FilterFctField;
}

export class FilterLayer extends L.Layer {

    options: FilterLayerOptions;

    constructor(options: FilterLayerOptions) {
        super(options);
        L.setOptions(this, options);
        this.onRemove(window.map);
    }


    onAdd(_map: L.Map): this {
        if (this.options.filterPortal) portalFilter.remove(this.options.filterPortal);
        if (this.options.filterLink) linkFilter.remove(this.options.filterLink);
        if (this.options.filterField) fieldFilter.remove(this.options.filterField);
        return this;
    }


    onRemove(_map: L.Map): this {
        if (this.options.filterPortal) portalFilter.add(this.options.filterPortal);
        if (this.options.filterLink) linkFilter.add(this.options.filterLink);
        if (this.options.filterField) fieldFilter.add(this.options.filterField);
        return this;
    }
}

type FilterFunction<T> = (entity: T) => boolean;
class Filter<ENTITY> {
    private filters: FilterFunction<ENTITY>[] = [];

    add(filter: FilterFunction<ENTITY>) {
        if (!this.filters.includes(filter)) {
            this.filters.push(filter);
            updateFilterState();
        }
    }

    remove(filter: FilterFunction<ENTITY>) {
        const index = this.filters.indexOf(filter);
        if (index >= 0) {
            this.filters.splice(index, 1);
            updateFilterState();
        }
    }

    filter(entity: ENTITY): boolean {
        return this.filters.some(filter => filter(entity));
    }
}


export const portalFilter = new Filter<IITC.Portal>()
export const linkFilter = new Filter<IITC.Link>()
export const fieldFilter = new Filter<IITC.Field>()

const updateFilterState = () => {
    for (const guid in window.portals) {
        const p = window.portals[guid];
        if (portalFilter.filter(p)) p.remove();
        else p.addTo(window.map);
    }
    for (const guid in window.links) {
        const link = window.links[guid];
        if (linkFilter.filter(link)) link.remove();
        else link.addTo(window.map);
    }

    IITCr.fields.all.forEach(field => {
        if (fieldFilter.filter(field))
            field.remove();
        else
            field.addTo(window.map);
    });
}
