/* eslint-disable @typescript-eslint/no-empty-interface */
/* tslint:disable:no-namespace */
/* tslint:disable:no-empty-interface */

// geodesic
declare namespace L {
    interface GeodesicPolylineStatic extends L.Polyline { }
    export const GeodesicPolyline: GeodesicPolylineStatic;
    export interface GeodesicPolyline extends Polyline {
        getLatLngs(): L.LatLng[];
    }

    interface GeodesicPolygonStatic extends L.Polygon { }
    export const GeodesicPolygon: GeodesicPolygonStatic;
    export interface GeodesicPolygon extends GeodesicPolyline { }

    interface GeodesicCircleStatic extends L.Polyline { }
    export const GeodesicCircle: GeodesicCircleStatic;
    export interface GeodesicCircle extends GeodesicPolyline { }

    function geodesicPolyline(latlngs: L.LatLng[], options: L.PolylineOptions): GeodesicPolyline;
    function geodesicPolygon(latlngs: L.LatLng[], options: L.PolylineOptions): GeodesicPolygon;


    export interface PolylineOptions {
        interactive?: boolean;
    }
    export interface MarkerOptions {
        interactive?: boolean;
    }
}
