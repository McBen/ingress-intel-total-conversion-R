import { FACTION, FACTION_COLORS } from "../constants";
import { IITC } from "../IITC";

const COLOR_SELECTED_PORTAL = "#f0f";


export const portalMarkerScale = (): number => {
    const zoom = window.map.getZoom();
    if (L.Browser.mobile) {
        return zoom >= 16 ? 1.5 : zoom >= 14 ? 1.2 : zoom >= 11 ? 1.0 : zoom >= 8 ? 0.65 : 0.5;
    } else {
        return zoom >= 14 ? 1 : zoom >= 11 ? 0.8 : zoom >= 8 ? 0.65 : 0.5;
    }
}

/**
 * create a new marker.
 * 'data' contain the IITC-specific entity data to be stored in the object options
 **/
export const createMarker = (latlng: L.LatLng, data: IITC.PortalOptions): IITC.Portal => {
    const styleOptions = getMarkerStyleOptions(data);

    const options = L.extend({}, data, styleOptions, { interactive: true });

    const marker = L.circleMarker(latlng, options) as IITC.Portal;

    IITC.highlighter.highlightPortal(marker);

    return marker;
}


export const setMarkerStyle = (marker: IITC.Portal, selected: boolean): void => {

    const styleOptions = getMarkerStyleOptions(marker.options);
    marker.setStyle(styleOptions);

    // FIXME? it's inefficient to set the marker style (above), then do it again inside the highlighter
    // the highlighter API would need to be changed for this to be improved though. will it be too slow?
    IITC.highlighter.highlightPortal(marker);

    if (selected) {
        marker.setStyle({ color: COLOR_SELECTED_PORTAL });
    }
}


export const getMarkerStyleOptions = (details: IITC.PortalOptions): L.CircleMarkerOptions => {
    const scale = portalMarkerScale();

    //   portal level      0  1  2  3  4  5  6  7  8
    const LEVEL_TO_WEIGHT = [2, 2, 2, 2, 2, 3, 3, 4, 4];
    const LEVEL_TO_RADIUS = [7, 7, 7, 7, 8, 8, 9, 10, 11];

    const level = Math.floor(details.level || 0);

    let weight = LEVEL_TO_WEIGHT[level] * Math.sqrt(scale);
    const radius = LEVEL_TO_RADIUS[level] * scale;

    let dashArray;
    // thinner and dashed outline for placeholder portals
    if (details.team !== FACTION.none && level === 0) {
        weight = 1;
        dashArray = "1,2";
    }

    const options: L.CircleMarkerOptions = {
        radius,
        stroke: true,
        color: FACTION_COLORS[details.team],
        weight,
        opacity: 1,
        fill: true,
        fillColor: FACTION_COLORS[details.team],
        fillOpacity: 0.5,
        dashArray
    };

    return options;
}

