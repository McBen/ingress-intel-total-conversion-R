import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginHighlightHighLevel extends Plugin {

    public name = "Highlight high level portals";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote high level portals: Purple L8, Red L7, Orange L6";
    public author = "jonatkins";
    public tags: ["portal", "highlight", "level"];
    public defaultInactive = true;
    private menuName = "Higher Level Portals";


    private styles = {
        level6: {
            fillOpacity: 0.7,
            fillColor: "orange"
        },
        level7: {
            fillOpacity: 0.7,
            fillColor: "red"
        },
        level8: {
            fillOpacity: 0.7,
            fillColor: "magenta"
        }
    };

    highlightHighLevel = (portal: IITC.Portal): void => {
        const portal_level = portal.options.data.level;
        if (portal_level === undefined) return;

        const newStyle = this.styles[`level${portal_level}`] as L.CircleMarkerOptions;

        if (newStyle) {
            portal.setStyle(newStyle);
        }
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.highlightHighLevel });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
