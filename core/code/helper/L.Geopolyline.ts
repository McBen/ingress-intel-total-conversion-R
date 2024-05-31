import { Map } from "leaflet";
import * as Vec from "../helper/vector";


const toRepaint: GeodesicPolyline3[] = [];

const repaintAll = () => {
    // TODO: store & convert bounds; recalc points + call redraw, replace "_projectLatlngs"
    toRepaint.forEach(p => p.redraw());
}



// var llbb; llbb && map.removeLayer(llbb); llbb = L.rectangle(map.getBounds().pad(-0.8)); map.addLayer(llbb); 

// A: https://intel.ingress.com/intel?ll=,z=17
// C: https://intel.ingress.com/intel?ll=,&z=17  
// [{"type":"polyline","latLngs":[{"lat":55.477626,"lng":9.458853},{"lat":53.785501,"lng":9.415725}],"color":"#ff0000"},{"type":"polygon","latLngs":[{"lat":55.477626,"lng":9.458853},{"lat":53.785501,"lng":9.415725},{"lat":54.73886933043496,"lng":9.43299651145935}],"color":"#a24ac3"}]  
// B: https://intel.ingress.com/intel?ll=54.73925,9.439722&z=17

export class GeodesicPolyline3 extends L.Polyline {

    onAdd(map: Map): this {
        if (toRepaint.length === 0) {
            window.map.on("moveend", repaintAll);
        }
        toRepaint.push(this);

        return super.onAdd(map);
    }

    onRemove(map: Map): this {
        const index = toRepaint.indexOf(this);
        if (index >= 0) {
            toRepaint.splice(index, 1);
            if (toRepaint.length === 0) {
                window.map.off("moveend", repaintAll);
            }
        }
        return super.onRemove(map);
    }


    _projectLatlngs(latlngs: L.LatLng[], result: L.LatLng[], projectedBounds: L.LatLngBounds) {
        // @ts-ignore // TODO add decalration of _defaultShape
        latlngs = this._defaultShape();
        if (latlngs.length === 0) return;

        const geo_latlngs = this.geodesicConvertLines(latlngs);

        // @ts-ignore // TODO add decalration of _projectLatlngs
        super._projectLatlngs(geo_latlngs, result, projectedBounds);
    }


    private geodesicConvertLines(latlngs: L.LatLng[]): L.LatLng[] {

        const bounds = window.map.getBounds().pad(-0.8); // TODO: for debug only
        const cbounds = this.boundsToVector(bounds);

        const result = [
            bounds.getNorthWest(),
            bounds.getNorthEast(),
            bounds.getSouthEast(),
            bounds.getSouthWest(),
            bounds.getNorthWest(),
        ];

        // result.push(latlngs[0]);

        let start = Vec.LatLngToXYZ(latlngs[0]);

        for (let i = 1; i < latlngs.length; i++) {
            let end = Vec.LatLngToXYZ(latlngs[i]);

            let startClipped = this.boundCollission(start, end, cbounds);
            let endClipped = this.boundCollission(end, start, cbounds);

            // if (startClipped) result.push(Vec.XYZToLLatLng(startClipped));
            result.push(Vec.XYZToLLatLng(startClipped || start));

            this.addPathLatLngs(startClipped || start, endClipped || end, result);

            if (!endClipped) result.push(Vec.XYZToLLatLng(end));
            // if (endClipped) result.push(Vec.XYZToLLatLng(end));
            start = end;
        }

        return result;;
    }


    private boundsToVector(bounds): Vec.XYZ[] {
        const nw = bounds.getNorthWest();
        const ne = bounds.getNorthEast();
        const se = bounds.getSouthEast();
        const sw = bounds.getSouthWest();

        return [
            Vec.LatLngToXYZ(nw),
            Vec.LatLngToXYZ(ne),
            Vec.LatLngToXYZ(se),
            Vec.LatLngToXYZ(sw)
        ]
    }

    private boundCollission(x: Vec.XYZ, target: Vec.XYZ, cbounds: Vec.XYZ[]): Vec.XYZ | undefined {
        let c = this.planeCollision(x, target, cbounds[0], cbounds[1]);  // north
        c = this.planeCollision(c || x, target, cbounds[1], cbounds[2]) || c; // east
        c = this.planeCollision(c || x, target, cbounds[2], cbounds[3]) || c; // south
        c = this.planeCollision(c || x, target, cbounds[3], cbounds[0]) || c; // west
        return c;
    }

    private planeCollision(x: Vec.XYZ, target: Vec.XYZ, p1: Vec.XYZ, p2: Vec.XYZ): Vec.XYZ | undefined {
        const p_norm = Vec.cross(p1, p2);
        if (Vec.dot(x, p_norm) <= 0) return; // its right of plane(inside)
        if (Vec.dot(target, p_norm) > 0) return; // both on same sice

        const lineDir = Vec.minus(target, x);
        const dotProduct = Vec.dot(p_norm, lineDir);
        if (dotProduct === 0) return; // parallel to bounds ; 

        const t = Vec.dot(Vec.minus(p1, x), p_norm) / dotProduct;
        // const t = -Vec.dot(p_norm, Vec.minus(x, p1)) / dotProduct;

        const p = Vec.move(x, lineDir, t)
        console.assert(Math.abs(Vec.dot(p, p_norm)) < 1e-9, "point is not on plane");
        Vec.normalize(p);
        return p;
    }

    private addPathLatLngs(start: Vec.XYZ, end: Vec.XYZ, result: L.LatLng[]): void {

        const direction = Vec.minus(end, start);
        const segments = 5;
        for (let i = 1; i <= segments; i++) {
            const p = Vec.move(start, direction, i / segments);
            Vec.normalize(p);
            result.push(Vec.XYZToLLatLng(p));
        }
    };
}


