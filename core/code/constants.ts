export const enum FACTION {
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



export const teamStr2Faction = (name: "ENLIGHTENED" | "RESISTANCE" | "NEUTRAL" | "ALIENS"): FACTION => {
    switch (name) {
        case "RESISTANCE": return FACTION.RES;
        case "ENLIGHTENED": return FACTION.ENL;
        case "ALIENS": return FACTION.ENL;
        default: return FACTION.none;
    }
}
