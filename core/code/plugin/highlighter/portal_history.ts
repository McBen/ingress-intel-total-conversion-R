import { IITC } from "../../IITC";
import { HISTORY } from "../../portal/portal_info";
import { Plugin } from "../plugin_base";


const styles = {
    marked: {
        fillColor: "red",
        fillOpacity: 1
    },
    semiMarked: {
        fillColor: "yellow",
        fillOpacity: 1
    }
};

const was = (history: number, flag: HISTORY): boolean => {
    // eslint-disable-next-line no-bitwise
    return (!!(history & flag));
}

export class PluginHighlightPortalHistory extends Plugin {

    public name = "Highlight portals based on history";
    public version = "0.3.0";
    public description = "Use the portal fill color to denote the portal has been visited, captured, scout controlled";
    public author = "Johtaja";
    public tags: ["portal", "highlight", "history", "captured", "visited", "unique"];
    public defaultInactive = true;



    activate(): void {
        IITC.highlighter.add({ name: "History: visited/captured", highlight: this.visited });
        IITC.highlighter.add({ name: "History: not visited/captured", highlight: this.NotVisited });
        IITC.highlighter.add({ name: "History: scout controlled", highlight: this.scoutControlled });
        IITC.highlighter.add({ name: "History: not scout controlled", highlight: this.notScoutControlled });
    }

    deactivate(): void {
        IITC.highlighter.remove("History: visited/captured");
        IITC.highlighter.remove("History: not visited/captured");
        IITC.highlighter.remove("History: scout controlled");
        IITC.highlighter.remove("History: not scout controlled");
    }


    visited = (portal: IITC.Portal) => {
        const history = portal.options.data.history;
        if (history === undefined) return;

        if (was(history, HISTORY.captured)) {
            portal.setStyle(styles.marked);
        } else if (was(history, HISTORY.visited)) {
            portal.setStyle(styles.semiMarked);
        }
    }

    NotVisited = (portal: IITC.Portal) => {
        const history = portal.options.data.history;
        if (history === undefined) return;

        if (!was(history, HISTORY.visited)) {
            portal.setStyle(styles.marked);
        } else if (!was(history, HISTORY.captured)) {
            portal.setStyle(styles.semiMarked);
        }
    }

    scoutControlled = (portal: IITC.Portal) => {
        const history = portal.options.data.history;
        if (history === undefined) return;

        if (was(history, HISTORY.scoutControlled)) {
            portal.setStyle(styles.marked);
        }
    }


    notScoutControlled = (portal: IITC.Portal) => {
        const history = portal.options.data.history;
        if (history === undefined) return;

        if (!was(history, HISTORY.scoutControlled)) {
            portal.setStyle(styles.marked);
        }
    }

}
