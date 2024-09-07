import { PluginHighlight } from "./_base";


export class PluginHighlightHighLevel extends PluginHighlight {

    public name = "Highlight high level portals";
    public version = "0.2.0";
    public description = "Use the portal fill color to denote high level portals: Purple L8, Red L7, Orange L6";
    public author = "jonatkins";
    public tags: ["portal", "highlight", "level"];
    public defaultInactive = true;
    protected menuName = "Higher Level Portals";


    private styles: Record<string, Partial<L.CircleMarkerOptions>> = {
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

    highlight(portal: IITC.Portal): void {
        const portal_level = portal.options.data.level;
        if (portal_level === undefined) return;

        const newStyle = this.styles[`level${portal_level}`];

        if (newStyle) {
            portal.setStyle(newStyle);
        }
    }
}
