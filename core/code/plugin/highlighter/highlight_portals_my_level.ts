import { FACTION } from "../../constants";
import { IITC } from "../../IITC";
import { getMarkerStyleOptions } from "../../map/portal_marker";
import { Plugin } from "../plugin_base";
import { player } from "../../helper/player";


export class PluginHightlightMyLevel extends Plugin {

    public name = "Highlight portals by my level";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote if the portal is either at and above, or at and below your level";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "level", "mylevel"];
    public defaultInactive = true;
    private menuNameBelow = "Below My Level";
    private menuNameAbove = "Above My Level";

    belowMyLevel = (portal: IITC.Portal): void => {
        this.colorLevel(true, portal);
    }

    aboveMyLevel = (portal: IITC.Portal): void => {
        this.colorLevel(false, portal);
    }

    private colorLevel(below: boolean, portal: IITC.Portal) {
        const portal_level = portal.options.level;

        // as portal levels can never be higher than L8, clamp the player level to this for highlight purposes
        const player_level = Math.min(player.level, 8);

        const fillOpacity = .6;
        if ((below && portal_level <= player_level) ||
            (!below && portal_level >= player_level)) {
            portal.setStyle({ fillColor: "red", fillOpacity });
        }
    }


    hideOwnership = (portal: IITC.Portal): void => {
        const portalStyle = getMarkerStyleOptions({ team: FACTION.none, level: 0 } as IITC.PortalOptions);
        portal.setStyle(portalStyle);
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuNameBelow, highlight: this.belowMyLevel });
        IITC.highlighter.add({ name: this.menuNameAbove, highlight: this.aboveMyLevel });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuNameBelow);
        IITC.highlighter.remove(this.menuNameAbove);
    }
}


