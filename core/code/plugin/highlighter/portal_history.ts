import { IITCr } from "../../IITC";
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

const was = (history: number | undefined, flag: HISTORY): boolean => {
    // eslint-disable-next-line no-bitwise
    return (!!((history || 0) & flag));
}

export class PluginHighlightPortalHistory extends Plugin {

    public name = "Highlight portals based on history";
    public version = "0.3.0";
    public description = "Use the portal fill color to denote the portal has been visited, captured, scout controlled";
    public author = "Johtaja";
    public tags: ["portal", "highlight", "history", "captured", "visited", "unique"];
    public defaultInactive = true;



    activate(): void {
        IITCr.highlighter.add({ name: "History: visited/captured", highlight: this.visited });
        IITCr.highlighter.add({ name: "History: not visited/captured", highlight: this.NotVisited });
        IITCr.highlighter.add({ name: "History: scout controlled", highlight: this.scoutControlled });
        IITCr.highlighter.add({ name: "History: not scout controlled", highlight: this.notScoutControlled });
    }

    deactivate(): void {
        IITCr.highlighter.remove("History: visited/captured");
        IITCr.highlighter.remove("History: not visited/captured");
        IITCr.highlighter.remove("History: scout controlled");
        IITCr.highlighter.remove("History: not scout controlled");
    }


    visited = (portal: IITC.Portal) => {
        const history = portal.options.data.history;

        if (was(history, HISTORY.captured)) {
            portal.setStyle(styles.marked);
        } else if (was(history, HISTORY.visited)) {
            portal.setStyle(styles.semiMarked);
        }
    }

    NotVisited = (portal: IITC.Portal) => {
        const history = portal.options.data.history;

        if (!was(history, HISTORY.visited)) {
            portal.setStyle(styles.marked);
        } else if (!was(history, HISTORY.captured)) {
            portal.setStyle(styles.semiMarked);
        }
    }

    scoutControlled = (portal: IITC.Portal) => {
        const history = portal.options.data.history;

        if (was(history, HISTORY.scoutControlled)) {
            portal.setStyle(styles.marked);
        }
    }


    notScoutControlled = (portal: IITC.Portal) => {
        const history = portal.options.data.history;

        if (!was(history, HISTORY.scoutControlled)) {
            portal.setStyle(styles.marked);
        }
    }
}
