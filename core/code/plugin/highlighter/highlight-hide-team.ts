import { FACTION } from "../../constants";
import { IITC } from "../../IITC";
import { getMarkerStyleOptions } from "../../map/portal_marker";
import { Plugin } from "../plugin_base";


export class PluginHidePortalOwnership extends Plugin {

    public name = "Hide portal ownership";
    public version = "0.2.0";
    public description = "Show all portals as neutral, as if uncaptured. Great for creating plans.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "neutral", "nocolor", "owner"];
    public defaultInactive = true;
    private menuName = "Hide portal ownership";


    hideOwnership = (portal: IITC.Portal): void => {
        const portalStyle = getMarkerStyleOptions({ team: FACTION.none, level: 0 } as IITC.PortalOptions);
        portal.setStyle(portalStyle);
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.hideOwnership });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}

