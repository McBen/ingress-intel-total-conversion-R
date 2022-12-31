import { FACTION } from "../../constants";
import { PluginHighlight } from "./highligh_plugin_base";

export class PluginHighlightMissingReso extends PluginHighlight {

    public name = "Highlight portals missing resonators";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote if the portal is missing resonators.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "inactive", "unclaimed"];
    public defaultInactive = true;
    protected menuName = "Portals Missing Resonators";


    highlight(portal: IITC.Portal): void {
        if (portal.options.team !== FACTION.none) {
            const res_count = portal.options.data.resCount;

            if (res_count !== undefined && res_count < 8) {
                const fill_opacity = ((8 - res_count) / 8) * .85 + .15;
                // Hole per missing resonator
                const dash = "1,4,".repeat(8 - res_count) + "100,0";
                const style = { fillOpacity: fill_opacity, dashArray: dash, fillcolor: "red" };
                portal.setStyle(style);
            }
        }
    }
}
