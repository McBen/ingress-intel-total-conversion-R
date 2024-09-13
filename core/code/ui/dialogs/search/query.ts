import * as L from "leaflet";
import { DEFAULT_ZOOM } from "../../../constants";
import { hooks } from "../../../helper/hooks";

const HIGHTLIGHT_COLOER = "yellow";
export interface QueryResult {
    title: string;
    icon?: string;
    description?: string;
    position?: L.LatLng;
    bounds?: L.LatLngBounds;
    layer?: L.LayerGroup;
    onSelected?: (result: QueryResult, event: any) => void | boolean;
    onRemove?: (result: QueryResult) => void;

}


export class Query {

    public term: string;
    public confirmed: boolean;

    private container: JQuery;

    private results: QueryResult[]
    private list: JQuery;
    private selectedResult: QueryResult | undefined;
    private hoverResult: QueryResult | undefined;


    getContainer(): JQuery {
        this.container = $("<div>", { class: "searchquery" });
        return this.container;
    }

    query(term: string, confirmed: boolean) {

        // don't make the same query again
        if (this.confirmed === confirmed && this.term === term) return;
        if (!confirmed && this.term === term) return;
        if (term === "") return;

        this.term = term;
        this.confirmed = confirmed;
        this.results = [];

        this.startQuery();
    }


    private startQuery() {
        const head = $("<h3>", { text: this.getHeaderText() });
        this.list = $("<ul>")
            .append($("<li>").text(this.confirmed ? "No local results, searching online..." : "No local results."));

        this.container.empty().append(head, this.list);
        this.clear();

        hooks.trigger("search", this);
    }



    private getHeaderText(): string {
        if (this.confirmed) return this.term;

        let text = this.term;
        if (this.term.length > 16) {
            text = this.term.slice(0, 8) + "…" + this.term.slice(-8);
        }


        return text + " (Return to load more)";
    }


    clear() {
        this.removeSelectedResult();
        this.removeHoverResult();
    }


    addResult(result: QueryResult) {
        if (this.results.length === 0) {
            // remove 'No results'
            this.list.empty();
        }

        this.results.push(result);
        const item = $("<li>")
            .appendTo(this.list)
            .attr("tabindex", "0")
            .on("click dblclick", event => this.onResultSelected(result, event))
            .on("mouseover", () => this.onResultHoverStart(result))
            .on("mouseout", () => this.onResultHoverEnd())
            .on("keypress", event => {
                if (event.key === " ") {
                    event.preventDefault();
                    this.onResultSelected(result, event);
                    return;
                }
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.onResultSelected(result, event);
                    return;
                }
            });

        const link = $("<a>")
            .append(result.title)
            .appendTo(item);

        if (result.icon) {
            link.css("background-image", 'url("' + result.icon + '")');
            item.css("list-style", "none");
        }

        if (result.description) {
            item
                .append($("<br>"))
                .append($("<em>")
                    .append(result.description));
        }

    }

    resultLayer(result: QueryResult): L.LayerGroup {
        if (result.layer !== null && !result.layer) {
            result.layer = L.layerGroup();

            if (result.position) {
                L.marker(result.position, {
                    // @ts-ignore
                    icon: L.divIcon.coloredSvg(HIGHTLIGHT_COLOER),
                    title: result.title
                }).addTo(result.layer);
            }

            if (result.bounds) {
                L.rectangle(result.bounds, {
                    interactive: false,
                    color: HIGHTLIGHT_COLOER,
                    fill: false
                }).addTo(result.layer);
            }
        }
        return result.layer;
    }


    onResultSelected(result: QueryResult, event: any) {
        this.removeHoverResult();
        this.removeSelectedResult();
        this.selectedResult = result;

        if (result.onSelected) {
            if (result.onSelected(result, event)) return;
        }

        if (event.type === "dblclick") {
            if (result.position) {
                window.map.setView(result.position, DEFAULT_ZOOM);
            } else if (result.bounds) {
                window.map.fitBounds(result.bounds, { maxZoom: DEFAULT_ZOOM });
            }
        } else {
            if (result.bounds) {
                window.map.fitBounds(result.bounds, { maxZoom: DEFAULT_ZOOM });
            } else if (result.position) {
                window.map.setView(result.position);
            }
        }

        result.layer = this.resultLayer(result);

        if (result.layer) {
            window.map.addLayer(result.layer);
        }

        if (window.isSmartphone()) window.show("map");
    }


    removeSelectedResult() {
        if (this.selectedResult) {
            if (this.selectedResult.layer) window.map.removeLayer(this.selectedResult.layer);
            if (this.selectedResult.onRemove) this.selectedResult.onRemove(this.selectedResult);
        }
    }


    onResultHoverStart(result: QueryResult) {
        this.removeHoverResult();
        this.hoverResult = result;

        if (result === this.selectedResult) return;

        result.layer = this.resultLayer(result);

        if (result.layer) window.map.addLayer(result.layer);
    }


    private removeHoverResult() {
        if (this.hoverResult !== this.selectedResult) {
            if (this.hoverResult) {
                if (this.hoverResult.layer) { window.map.removeLayer(this.hoverResult.layer); }
            }
        }
        this.hoverResult = undefined;
    }


    onResultHoverEnd() {
        this.removeHoverResult();
    }
}
