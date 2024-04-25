import { FACTION } from "../../constants";
import { PluginHighlight } from "./_base";


export class PluginHighlightWeakness extends PluginHighlight {

    public name = "Highlight portal weakness";
    public version = "0.8.0";
    public description = "Use the fill color of the portals to denote if the portal is weak. " +
        "Stronger red indicates recharge required, missing resonators, or both";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "weakness", "recharge"];
    public defaultInactive = true;
    protected menuName = "Portal Weakness";


    highlight(portal: IITC.Portal): void {
        const res_count = portal.options.data.resCount;
        const health = portal.options.data.health;

        if (res_count !== undefined && health !== undefined && portal.options.team !== FACTION.none) {

            const strength = (res_count / 8) * (health / 100);
            if (strength < 1) {
                const fillOpacity = (1 - strength) * .85 + .15;
                const color = "red";
                const style: L.CircleMarkerOptions = { radius: portal.getRadius(), fillColor: color, fillOpacity };

                // Hole per missing resonator
                if (res_count < 8) {
                    const dash = "1,4,".repeat(8 - res_count) + "100,0";
                    style.dashArray = dash;
                }

                portal.setStyle(style);
            }
        }
    }

}
