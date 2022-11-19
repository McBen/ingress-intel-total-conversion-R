import { MIN_ZOOM } from "../constants";
import { dialog } from "../ui/dialog";


export interface TileParameters {
    level: number,
    tilesPerEdge: number,
    minLinkLength: number,
    hasPortals: boolean,  // no portals returned at all when link length limits things
    zoom: number  // include the zoom level, for reference
}


export const setupDataTileParameters = () => {
    // default values - used to fall back to if we can't detect those used in stock intel
    const DEFAULT_ZOOM_TO_TILES_PER_EDGE = [1, 1, 1, 40, 40, 80, 80, 320, 1000, 2000, 2000, 4000, 8000, 16000, 16000, 32000];
    const DEFAULT_ZOOM_TO_LEVEL = [8, 8, 8, 8, 7, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1, 1];

    // stock intel doesn't have this array (they use a switch statement instead), but this is far neater
    const DEFAULT_ZOOM_TO_LINK_LENGTH = [200000, 200000, 200000, 200000, 200000, 60000, 60000, 10000, 5000, 2500, 2500, 800, 300, 0, 0];

    // @ts-ignore
    window.TILE_PARAMS = {};

    // not in stock to detect - we'll have to assume the above values...
    window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH = DEFAULT_ZOOM_TO_LINK_LENGTH;


    if (niantic_params.ZOOM_TO_LEVEL && niantic_params.TILES_PER_EDGE) {
        window.TILE_PARAMS.ZOOM_TO_LEVEL = niantic_params.ZOOM_TO_LEVEL;
        window.TILE_PARAMS.TILES_PER_EDGE = niantic_params.TILES_PER_EDGE;


        // lazy numerical array comparison
        if (JSON.stringify(niantic_params.ZOOM_TO_LEVEL) !== JSON.stringify(DEFAULT_ZOOM_TO_LEVEL)) {
            throw new Error("Tile parameter ZOOM_TO_LEVEL have changed in stock intel. Detected correct values, but code should be updated");
        }
        if (JSON.stringify(niantic_params.TILES_PER_EDGE) !== JSON.stringify(DEFAULT_ZOOM_TO_TILES_PER_EDGE)) {
            throw new Error("Tile parameter TILES_PER_EDGE have changed in stock intel. Detected correct values, but code should be updated");
        }

    } else {
        dialog({
            title: "IITC Warning",
            html: "<p>IITC failed to detect the ZOOM_TO_LEVEL and/or TILES_PER_EDGE settings from the stock intel site.</p>"
                + "<p>IITC is now using fallback default values. However, if detection has failed it's likely the values have changed."
                + " IITC may not load the map if these default values are wrong.</p>",
        });

        window.TILE_PARAMS.ZOOM_TO_LEVEL = DEFAULT_ZOOM_TO_LEVEL;
        window.TILE_PARAMS.TILES_PER_EDGE = DEFAULT_ZOOM_TO_TILES_PER_EDGE;
    }

    // 2015-07-01: niantic added code to the stock site that overrides the min zoom level for unclaimed portals to 15 and above
    // instead of updating the zoom-to-level array. makes no sense really....
    // we'll just chop off the array at that point, so the code defaults to level 0 (unclaimed) everywhere...
    window.TILE_PARAMS.ZOOM_TO_LEVEL = window.TILE_PARAMS.ZOOM_TO_LEVEL.slice(0, 15); // deprecated

}


export const getMapZoomTileParameters = (zoom: number): TileParameters => {

    const maxTilesPerEdge = window.TILE_PARAMS.TILES_PER_EDGE[window.TILE_PARAMS.TILES_PER_EDGE.length - 1];

    return {
        level: window.TILE_PARAMS.ZOOM_TO_LEVEL[zoom] || 0, // deprecated but still used in request
        tilesPerEdge: window.TILE_PARAMS.TILES_PER_EDGE[zoom] || maxTilesPerEdge,
        minLinkLength: window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH[zoom] || 0,
        hasPortals: zoom >= window.TILE_PARAMS.ZOOM_TO_LINK_LENGTH.length,  // no portals returned at all when link length limits things
        zoom  // include the zoom level, for reference
    };
}

export const getDataZoomTileParameters = (zoom?: number): TileParameters => {
    zoom = zoom ?? window.map.getZoom();
    const dataZoom = getDataZoomForMapZoom(zoom);
    return getMapZoomTileParameters(dataZoom);
}


export const getDataZoomForMapZoom = (zoom: number): number => {
    // we can fetch data at a zoom level different to the map zoom.

    // NOTE: the specifics of this are tightly coupled with the above ZOOM_TO_LEVEL and TILES_PER_EDGE arrays

    // firstly, some of IITCs zoom levels, depending on base map layer, can be higher than stock. limit zoom level
    // (stock site max zoom may vary depending on google maps detail in the area - 20 or 21 max is common)
    if (zoom > 21) {
        zoom = 21;
    }

    // to improve the cacheing performance, we try and limit the number of zoom levels we retrieve data for
    // to avoid impacting server load, we keep ourselves restricted to a zoom level with the sane number
    // of tilesPerEdge and portal levels visible

    const origTiles = getMapZoomTileParameters(zoom);

    while (zoom > MIN_ZOOM) {
        const newTiles = getMapZoomTileParameters(zoom - 1);

        if (newTiles.tilesPerEdge !== origTiles.tilesPerEdge
            || newTiles.hasPortals !== origTiles.hasPortals
            // multiply by 'hasPortals' - so comparison does not matter when no portals available
            || newTiles.level * (newTiles.hasPortals ? 1 : 0) !== origTiles.level * (origTiles.hasPortals ? 1 : 0)
        ) {
            // switching to zoom-1 would result in a different detail level - so we abort changing things
            break;
        } else {
            // changing to zoom = zoom-1 results in identical tile parameters - so we can safely step back
            // with no increase in either server load or number of requests
            zoom = zoom - 1;
        }
    }

    return zoom;
}


export const lngToTile = (lng: number, tiles: TileParameters): number => {
    return Math.floor((lng + 180) / 360 * tiles.tilesPerEdge);
}

export const latToTile = (lat: number, tiles: TileParameters): number => {
    return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
        1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * tiles.tilesPerEdge);
}

export const tileToLng = (x: number, tiles: TileParameters): number => {
    return x / tiles.tilesPerEdge * 360 - 180;
}

export const tileToLat = (y: number, tiles: TileParameters): number => {
    const n = Math.PI - 2 * Math.PI * y / tiles.tilesPerEdge;
    return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export const pointToTileId = (tiles: TileParameters, x: number, y: number): string => {
    // change to quadkey construction
    // as of 2014-05-06: zoom_x_y_minlvl_maxlvl_maxhealth
    return `${tiles.zoom}_${x}_${y}_${tiles.level}_8_100`;
}
