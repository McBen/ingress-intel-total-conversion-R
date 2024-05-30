import * as Vec from "../helper/vector";

export class GeodesicPolyline3 extends L.Polyline {

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

        const result = [];
        result.push(latlngs[0]);

        let start = Vec.LatLngToXYZ(latlngs[0]);

        for (let i = 1; i < latlngs.length; i++) {
            let end = Vec.LatLngToXYZ(latlngs[i]);

            let startClipped = this.boundCollission(start, end, cbounds);
            let endClipped = this.boundCollission(end, start, cbounds);

            if (startClipped) result.push(Vec.XYZToLLatLng(startClipped));

            this.addPathLatLngs(startClipped || start, endClipped || end, result);

            if (endClipped) result.push(Vec.XYZToLLatLng(end));
            start = end;
        }

        return result;;
    }


    private boundsToVector(bounds): Vec.XYZ[] {
        const nw = bounds.getNorthWest();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const se = bounds.getSouthEast();

        return [
            Vec.LatLngToXYZ(nw),
            Vec.LatLngToXYZ(ne),
            Vec.LatLngToXYZ(se),
            Vec.LatLngToXYZ(sw)
        ]
    }

    private boundCollission(x: Vec.XYZ, target: Vec.XYZ, cbounds: Vec.XYZ[]): Vec.XYZ | undefined {
        let c = this.planeCollision(x, target, cbounds[0], cbounds[1]);
        c = this.planeCollision(c || x, target, cbounds[1], cbounds[2]);
        c = this.planeCollision(c || x, target, cbounds[2], cbounds[3]);
        c = this.planeCollision(c || x, target, cbounds[3], cbounds[0]);
        return c;
    }

    private planeCollision(x: Vec.XYZ, target: Vec.XYZ, p1: Vec.XYZ, p2: Vec.XYZ): Vec.XYZ | undefined {
        const np = Vec.cross(p1, p2);
        if (Vec.dot(x, np) <= 0) return; // its inside
        if (Vec.dot(target, np) >= 0) return; // both on same sice

        const lineDir = Vec.minus(target, x);
        const dotProduct = Vec.dot(np, lineDir);
        if (dotProduct === 0) return; // parallel to bounds ; 

        const t = Vec.dot(Vec.minus(p1, x), np) / dotProduct;

        return Vec.move(x, lineDir, t);
    }

    private addPathLatLngs(start: Vec.XYZ, end: Vec.XYZ, result: L.LatLng[]): void {

        const direction = Vec.minus(end, start);
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
            const p = Vec.move(start, direction, i / segments);
            result.push(Vec.XYZToLLatLng(p));
        }
    };
}


