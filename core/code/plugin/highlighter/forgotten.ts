import { DAYS } from "../../helper/times";
import { PluginHighlight } from "./highligher_base";


export class PluginHighlightInactive extends PluginHighlight {

    public name = "Highlight inactive portals";
    public version = "0.2.0";
    public description =
        "Use the portal fill color to denote if the portal is unclaimed with no recent activity." +
        "Shades of red from one week to one month, then tinted to purple for longer." +
        "May also highlight captured portals that are stuck and fail to decay every 24 hours.";
    public author = "jonatkins";
    public tags: ["portal", "highlight", "inactive", "unclaimed"];
    public defaultInactive = true;
    protected menuName = "Inactive Portals";


    highlight(portal: IITC.Portal): void {
        if (portal.options.timestamp > 0) {
            const daysUnmodified = (Date.now() - portal.options.timestamp) / DAYS;
            if (daysUnmodified >= 7) {
                const fill_opacity = Math.min(1, ((daysUnmodified - 7) / 24) * .85 + .15);
                const blue = Math.max(0, Math.min(255, Math.round((daysUnmodified - 31) / 62 * 255)));
                const colour = `rgb(255,0,${blue})`;
                const style = { fillColor: colour, fillOpacity: fill_opacity };
                portal.setStyle(style);
            }
        }
    }
}
