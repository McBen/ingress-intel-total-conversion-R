export enum FACTION {
    none = 0,
    RES = 1,
    ENL = 2,
    MAC = 3
}

export const FACTION_COLORS = ["#FF6600", "#0088FF", "#03DC03", "#ff0028"]; // none, res, enl, mac
export const FACTION_NAMES = ["Neutral", "Resistance", "Enlightened", "Machina"];
export const FACTION_CSS = ["none", "res", "enl", "mac"];

export const COLORS_LVL = ["#000", "#FECE5A", "#FFA630", "#FF7315", "#E40000", "#FD2992", "#EB26CD", "#C124E0", "#9627F4"];

/**
 * min zoom for intel map
 * should match that used by stock intel
 */
export const MIN_ZOOM = 3;
/**
 * used when zoom level is not specified explicitly (must contain all the portals)
 */
export const DEFAULT_ZOOM = 15;


// User Parameters
//  Constants the use might want to change
// globalThis.MAX_IDLE_TIME = 15 * 60; // stop updating map after 15min idling
// globalThis.REFRESH = 30; // refresh view every 30s (base time)
