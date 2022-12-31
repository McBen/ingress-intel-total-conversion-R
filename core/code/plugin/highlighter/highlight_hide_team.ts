import { FACTION } from "../../constants";
import { getMarkerStyleOptions } from "../../map/portal_marker";
import { PluginHighlight } from "./highligh_plugin_base";


export class PluginHidePortalOwnership extends PluginHighlight {

    public name = "Hide portal ownership";
    public version = "0.2.0";
    public description = "Show all portals as neutral, as if uncaptured. Great for creating plans.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "neutral", "nocolor", "owner"];
    public defaultInactive = true;
    protected menuName = "Hide portal ownership";

    highlight(portal: IITC.Portal): void {
        const portalStyle = getMarkerStyleOptions({ team: FACTION.none, level: 0 } as IITC.PortalOptions);
        portal.setStyle(portalStyle);
    }
}
