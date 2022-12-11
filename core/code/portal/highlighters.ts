import { IITC } from "../IITC";

const STORE_KEY = "portal_highlighter";

export interface Highlighter {
    name: string;
    highlight: (portal: IITC.Portal) => void;
}

const NoHighlight = {
    name: "No Highlights",
    highlight: () => { /* NOOP */ }
}


export class Highlighters {
    private all: Highlighter[]
    private current: Highlighter;

    constructor() {
        this.all = [];
        this.current = NoHighlight;
    }

    add(highlighter: Highlighter): void {
        console.assert(!this.all.some(h => h.name === highlighter.name), "highlighter name already in use", highlighter.name);

        this.all.push(highlighter);

        if (highlighter.name === localStorage.getItem(STORE_KEY)) {
            this.current = highlighter;
        }

        IITC.menu.addEntry({
            name: "View\\Hightlight\\" + highlighter.name,
            onClick: () => this.changeHighlighter(this.current.name === highlighter.name ? undefined : highlighter.name),
            hasCheckbox: true,
            isChecked: () => this.current.name === highlighter.name
        });
    }

    remove(name: string): void {
        const highlightIndex = this.all.findIndex(h => h.name === name);
        if (highlightIndex < 0) return;

        this.all.splice(highlightIndex, 1);
        if (this.current.name === name) {
            this.changeHighlighter();
        }
    }

    changeHighlighter(name?: string): void {
        this.current = this.all.find(h => h.name === name) || NoHighlight;

        this.resetPortals();
        localStorage.setItem(STORE_KEY, this.current.name);
    }


    resetPortals(): void {
        $.each(window.portals, (guid, portal) => {
            setMarkerStyle(portal, guid === selectedPortal);
        });
    }


    highlightPortal(p: IITC.Portal): void {
        this.current.highlight(p);
    }
}
