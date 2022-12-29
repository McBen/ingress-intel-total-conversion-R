import { FACTION } from "../../constants";
import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginHighlightMissingReso extends Plugin {

    public name = "Highlight portals missing resonators";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote if the portal is missing resonators.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "inactive", "unclaimed"];
    public defaultInactive = true;
    private menuName = "Portals Missing Resonators";


    missingReso = (portal: IITC.Portal): void => {
        if (portal.options.team !== FACTION.none) {
            const res_count = portal.options.data.resCount;

            if (res_count !== undefined && res_count < 8) {
                const fill_opacity = ((8 - res_count) / 8) * .85 + .15;
                // Hole per missing resonator
                const dash = new Array((8 - res_count) + 1).join("1,4,") + "100,0";

                const style = { fillOpacity: fill_opacity, dashArray: dash, fillcolor: "red" };
                portal.setStyle(style);
            }
        }
    }

    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.missingReso });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
