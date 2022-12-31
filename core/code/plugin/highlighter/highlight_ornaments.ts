import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginHighlightOrnaments extends Plugin {

    public name = "Highlight portals with ornaments";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote portals with additional 'ornament' markers. e.g. Anomaly portals";
    public author = "jonatkins";
    public tags: ["portal", "highlight", "ornanaments"];
    public defaultInactive = true;
    private menuName = "Ornaments (anomaly portals)";


    ornamentshighlight = (portal: IITC.Portal): void => {
        const d = portal.options.data;
        if (d.ornaments && d.ornaments.length > 0) {

            const style = {
                fillcolor: "red",
                fillOpacity: 0.75
            };
            portal.setStyle(style);
        }
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.ornamentshighlight });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
