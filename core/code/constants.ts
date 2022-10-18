export enum FACTION {
    none = 0,
    RES = 1,
    ENL = 2,
}

export const FACTION_COLORS = ["#FF6600", "#0088FF", "#03DC03"]; // none, res, enl
export const FACTION_NAMES = ["Neutral", "Resistance", "Enlightened"];
export const FACTION_CSS = ["none", "res", "enl"];

/**
 * min zoom for intel map - should match that used by stock intel
 */
export const MIN_ZOOM = 3;



// User Parameters
//  Constants the use might want to change
globalThis.MAX_IDLE_TIME = 15 * 60; // stop updating map after 15min idling
globalThis.REFRESH = 30; // refresh view every 30s (base time)

