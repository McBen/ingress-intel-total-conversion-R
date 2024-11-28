/* eslint-disable @typescript-eslint/no-empty-interface */
/* tslint:disable:no-namespace */
/* tslint:disable:no-empty-interface */

// geodesic
declare namespace L {
    export class GeodesicPolyline extends L.Polyline {
        getLatLngs(): L.LatLng[];
    }
    export class GeodesicPolygon extends GeodesicPolyline { }

    interface GeodesicCircleStatic extends L.Polyline { }
    export const GeodesicCircle: GeodesicCircleStatic;
    export interface GeodesicCircle extends GeodesicPolyline { }

    function geodesicPolyline(latlngs: L.LatLng[], options: L.PolylineOptions): GeodesicPolyline;
    function geodesicPolygon(latlngs: L.LatLng[], options: L.PolylineOptions): GeodesicPolygon;
    function geodesicCircle(latlng: L.LatLng, radius: number, options: L.PolylineOptions): GeodesicCircle;


    export interface PolylineOptions {
        interactive?: boolean;
    }
    export interface MarkerOptions {
        interactive?: boolean;
    }

    export interface GridLayer {
        googleMutant(options: any): TileLayer;
    }

}
