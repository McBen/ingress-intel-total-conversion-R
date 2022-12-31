import { COLORS_LVL } from "../../constants";
import { PluginHighlight } from "./_base";


export class PluginHighlightLevelColor extends PluginHighlight {

    public name = "Highlight portals by level color";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote the portal level by using the game level colors.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "level"];
    public defaultInactive = true;
    protected menuName = "Level Color";


    highlight(portal: IITC.Portal): void {
        const portal_level = portal.options.data.level;
        if (portal_level !== undefined) {
            const fillOpacity = .6;
            portal.setStyle({ fillColor: COLORS_LVL[portal_level], fillOpacity });
        }
    }
}
