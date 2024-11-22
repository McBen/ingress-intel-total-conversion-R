import { pnpoly } from "../helper/utils_misc";

export class Fields {
    public all: IITC.Field[];

    constructor() {
        this.all = [];
    }

    add(field: IITC.Field) {
        this.all.push(field);
    }


    remove(guid: FieldGUID): IITC.Field | undefined {
        const index = this.all.findIndex(f => f.options.guid === guid);
        if (index !== -1) {
            return this.all.splice(index, 1)[0];
        }
        return;
    }


    get(guid: FieldGUID): IITC.Field | undefined {
        return this.all.find(f => f.options.guid === guid);
    }


    getByPortal(guid: PortalGUID): IITC.Field[] {
        return this.all.filter(f => {
            const d = f.options.data;
            return d.points[0].guid === guid || d.points[1].guid === guid || d.points[2].guid === guid;
        });
    }

    /**
     * Fields with atleast one Vertex in area
     */
    getInBounds(bounds: L.LatLngBounds): IITC.Field[] {
        return this.all.filter(field => {
            const points = field.getLatLngs();
            return bounds.contains(points[0]) || bounds.contains(points[1]) || bounds.contains(points[2]);
        });
    }

    /**
     * Fields at screen position
     */
    getAtPoint(point: L.Point): IITC.Field[] {
        return this.all.filter(field => {
            // eslint-disable-next-line no-underscore-dangle
            const positions: L.Point[][] = (<any>field)._rings;
            return pnpoly(positions[0], point);
        });
    }

    toOldObject(): Record<string, IITC.Field> {
        const result: Record<string, IITC.Field> = {};
        this.all.forEach(f => result[f.options.guid] = f);
        return result;
    }
}
