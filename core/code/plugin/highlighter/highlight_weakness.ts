import { FACTION } from "../../constants";
import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginHightlightWeakness extends Plugin {

    public name = "Highlight portal weakness";
    public version = "0.8.0";
    public description = "Use the fill color of the portals to denote if the portal is weak. " +
        "Stronger red indicates recharge required, missing resonators, or both";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "weakness", "recharge"];
    public defaultInactive = true;
    private menuName = "Portal Weakness";


    weaknessHighlight = (portal: IITC.Portal): void => {
        const res_count = portal.options.data.resCount;
        const health = portal.options.data.health;

        if (res_count !== undefined && health !== undefined && portal.options.team !== FACTION.none) {

            const strength = (res_count / 8) * (health / 100);
            if (strength < 1) {
                const fillOpacity = (1 - strength) * .85 + .15;
                const color = "red";
                const style: L.CircleMarkerOptions = { fillColor: color, fillOpacity };

                // Hole per missing resonator
                if (res_count < 8) {
                    const dash = new Array((8 - res_count) + 1).join("1,4,") + "100,0";
                    style.dashArray = dash;
                }

                portal.setStyle(style);
            }
        }
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.weaknessHighlight });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
