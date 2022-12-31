import { PluginHighlight } from "./highligher_base";


export class PluginHighlightOrnaments extends PluginHighlight {

    public name = "Highlight portals with ornaments";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote portals with additional 'ornament' markers. e.g. Anomaly portals";
    public author = "jonatkins";
    public tags: ["portal", "highlight", "ornanaments"];
    public defaultInactive = true;
    protected menuName = "Ornaments (anomaly portals)";


    highlight(portal: IITC.Portal): void {
        const d = portal.options.data;
        if (d.ornaments && d.ornaments.length > 0) {

            const style = {
                fillcolor: "red",
                fillOpacity: 0.75
            };
            portal.setStyle(style);
        }
    }
}
