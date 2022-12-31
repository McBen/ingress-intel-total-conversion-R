import { FACTION } from "../../constants";
import { PluginHighlight } from "./highligher_base";


export class PluginHighlightNeedRecharge extends PluginHighlight {

    public name = "Highlight portals that need recharging";
    public version = "0.2.0";
    public description =
        "Use the portal fill color to denote if the portal needs recharging and how much." +
        "Yellow: above 85%. Orange: above 70%. Red: above 15%. Magenta: below 15%.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "recharge"];
    public defaultInactive = true;

    protected menuName = "Needs Recharge (Health)";


    public conditions = [85, 70, 60, 45, 30, 15, 0];
    public styles = {
        cond85: { fillColor: "yellow", fillOpacity: 0.5 },
        cond70: { fillColor: "orange", fillOpacity: 0.5 },
        cond60: { fillColor: "darkorange", fillOpacity: 0.5 },
        cond45: { fillColor: "red", fillOpacity: 0.4 },
        cond30: { fillColor: "red", fillOpacity: 0.6 },
        cond15: { fillColor: "red", fillOpacity: 0.8 },
        cond0: { fillColor: "magenta", fillOpacity: 1.0 }
    };

    highlight(portal: IITC.Portal): void {
        const health = portal.options.data.health;

        if (health !== undefined && portal.options.team !== FACTION.none && health < 100) {
            const cond = this.conditions.find(c => c < health);
            const style = this.styles[`cond${cond}`] as L.CircleMarkerOptions;
            console.assert(style, "plugin_rechage: not matching style defs");
            portal.setStyle(style);
        }
    }
}
