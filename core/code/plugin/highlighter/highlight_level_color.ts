import { COLORS_LVL } from "../../constants";
import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginHighlightLevelColor extends Plugin {

    public name = "Highlight portals by level color";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote the portal level by using the game level colors.";
    public author = "vita10gy";
    public tags: ["portal", "highlight", "level"];
    public defaultInactive = true;
    private menuName = "Level Color";


    highlightLevelColor = (portal: IITC.Portal): void => {
        const portal_level = portal.options.data.level;
        if (portal_level !== undefined) {
            const fillOpacity = .6;
            portal.setStyle({ fillColor: COLORS_LVL[portal_level], fillOpacity });
        }
    }


    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: this.highlightLevelColor });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
