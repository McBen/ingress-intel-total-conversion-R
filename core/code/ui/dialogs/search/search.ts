import { FACTION, FACTION_COLORS } from "../../../constants";
import { Query, QueryResult } from "./query";
import * as geojson from "geojson";
import { hooks } from "../../../helper/hooks";
import { renderPortalDetails } from "../../../portal/portal_display";
import portalIcon from "!!raw-loader!../../../../images/icon-portal.svg";
import { selectPortalByLatLng } from "../../../map/url_paramater";
import { util } from "webpack";
import { zoomToAndShowPortal } from "../../../helper/utils_misc";

const NOMINATIM = "//nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=";
interface OpenStreetMapQueryResult {
    place_id: string,
    display_name: string,
    type: string,
    lat: string,
    lon: string,
    icon: string,
    geojson?: geojson.GeoJsonObject,
    boundingbox?: [number, number, number, number];
}


/**
 * you can implement your own result provider by listing to the search hook:
 * addHook('search', function(query) {});
 *
 * `query` is an object with the following members:
 * - `term` is the term for which the user has searched
 * - `confirmed` is a boolean indicating if the user has pressed enter after searching. You should not search online or
 *   do heavy processing unless the user has confirmed the search term
 * - `addResult(result)` can be called to add a result to the query.
 *
 * `result` may have the following members (`title` is required, as well as one of `position` and `bounds`):
 * - `title`: the label for this result. Will be interpreted as HTML, so make sure to escape properly.
 * - `description`: secondary information for this result. Will be interpreted as HTML, so make sure to escape properly.
 * - `position`: a L.LatLng object describing the position of this result
 * - `bounds`: a L.LatLngBounds object describing the bounds of this result
 * - `layer`: a ILayer to be added to the map when the user selects this search result. Will be generated if not set.
 *   Set to `null` to prevent the result from being added to the map.
 * - `icon`: a URL to a icon to display in the result list. Should be 12x12.
 * - `onSelected(result, event)`: a handler to be called when the result is selected. May return `true` to prevent the map
 *   from being repositioned. You may reposition the map yourself or do other work.
 * - `onRemove(result)`: a handler to be called when the result is removed from the map (because another result has been
 *   selected or the search was cancelled by the user).
 **/
export class Search {

    private lastSearch: Query | undefined;

    constructor() {
        hooks.on("search", this.searchPortals);
        hooks.on("search", this.searchLocations);
        hooks.on("search", this.searchOpenStreetMap);
    }


    doSearch(term: string, confirmed: boolean): void {
        term = term.trim();

        // minimum 3 characters for automatic search
        if (term.length < 3 && !confirmed) return;

        if (this.lastSearch) {
            // don't clear last confirmed search
            if (this.lastSearch.confirmed && !confirmed) return;

            // don't make the same query again
            if (this.lastSearch.confirmed === confirmed && this.lastSearch.term === term) return;

            this.lastSearch.hide();
            this.lastSearch = undefined;
        }

        // clear results
        if (term === "") return;

        if (useAppPanes()) show("info");

        $(".ui-tooltip").remove();

        this.lastSearch = new Query(term, confirmed);
        this.lastSearch.show();
    }


    searchPortals = (query: Query): void => {
        const term = query.term.toLowerCase();
        const teams = ["NEU", "RES", "ENL"];

        // eslint-disable-next-line guard-for-in
        for (const guid in window.portals) {

            const portal = window.portals[guid];
            const data = portal.options.data;
            if (!data.title) continue;

            if (data.title.toLowerCase().includes(term)) {
                const team = portal.options.team;
                const color = <FACTION>team === FACTION.none ? "#CCC" : FACTION_COLORS[team];
                query.addResult({
                    title: data.title,
                    description: `${teams[team]}, L${data.level}, ${data.health}%, ${data.resCount} Resonators`,
                    position: portal.getLatLng(),
                    icon: "data:image/svg+xml;base64," + btoa(portalIcon.replace(/%COLOR%/g, color)),
                    onSelected: (result, event) => {
                        if (event.type === "dblclick") {
                            zoomToAndShowPortal(guid, portal.getLatLng());
                        } else if (window.portals[guid]) {
                            if (!window.map.getBounds().contains(result.position)) window.map.setView(result.position);
                            renderPortalDetails(guid);
                        } else {
                            selectPortalByLatLng(portal.getLatLng());
                        }
                        return true; // prevent default behavior
                    }
                });
            }
        }
    }


    searchLocations = (query: Query) => {
        const locations = query.term.match(/[+-]?\d+\.\d+[,\s]+[+-]?\d+\.\d+/g);

        if (!locations) return;

        const added = {};
        locations.forEach(location => {
            const pair = location.split(",").map(s => parseFloat(s).toFixed(6));
            const latlngstr = pair.join(",");
            const latlng = L.latLng(pair.map(s => parseFloat(s)) as [number, number]);
            if (added[latlngstr]) return;
            added[latlngstr] = true;

            query.addResult({
                title: latlngstr,
                description: "geo coordinates",
                position: latlng,
                onSelected: (result, _event) => {
                    // eslint-disable-next-line guard-for-in
                    for (const guid in window.portals) {
                        const ll = window.portals[guid].getLatLng();
                        if ((ll.lat.toFixed(6) + "," + ll.lng.toFixed(6)) === latlngstr) {
                            renderPortalDetails(guid);
                            return;
                        }
                    }

                    urlPortalLL = [result.position.lat, result.position.lng];
                }
            });
        });
    }



    searchOpenStreetMap = (query: Query) => {
        if (!query.confirmed) return;

        // Viewbox search orders results so they're closer to the viewbox
        const mapBounds = window.map.getBounds();
        // eslint-disable-next-line max-len
        const viewbox = `&viewbox=${mapBounds.getSouthWest().lng},${mapBounds.getSouthWest().lat},${mapBounds.getNorthEast().lng},${mapBounds.getNorthEast().lat}`;

        let resultCount = 0;
        const resultMap = {};

        const onQueryResult = (isViewboxResult, data: OpenStreetMapQueryResult[]) => {
            resultCount += data.length;
            if (isViewboxResult) {
                // Search for things outside the viewbox
                $.getJSON(NOMINATIM + encodeURIComponent(query.term) + viewbox, onQueryResult.bind(null, false));
                if (resultCount === 0) { return; }
            } else {
                if (resultCount === 0) {
                    query.addResult({
                        title: "No results on OpenStreetMap",
                        icon: "//www.openstreetmap.org/favicon.ico",
                        onSelected: () => true
                    });
                    return;
                }
            }

            data.forEach(item => {
                if (resultMap[item.place_id]) { return; } // duplicate
                resultMap[item.place_id] = true;

                const result: QueryResult = {
                    title: item.display_name,
                    description: `Type: ${item.type}`,
                    position: L.latLng(parseFloat(item.lat), parseFloat(item.lon)),
                    icon: item.icon
                };

                if (item.geojson) {
                    result.layer = L.geoJson(item.geojson, {
                        interactive: false,
                        style: () => {
                            return {
                                color: "red",
                                opacity: 0.7,
                                weight: 2,
                                fill: false
                            }
                        },
                        pointToLayer: (_featureData, latLng) => {
                            return L.marker(latLng, {
                                // @ts-ignore
                                icon: L.divIcon.coloredSvg("red"),
                                title: item.display_name
                            });
                        }
                    });
                }

                const b = item.boundingbox;
                if (b) {
                    const southWest = new L.LatLng(b[0], b[2]);
                    const northEast = new L.LatLng(b[1], b[3]);
                    result.bounds = new L.LatLngBounds(southWest, northEast);
                }

                query.addResult(result);
            });
        }

        // Bounded search allows amenity-only searches (e.g. "amenity=toilet") via special phrases
        // http://wiki.openstreetmap.org/wiki/Nominatim/Special_Phrases/EN
        const bounded = "&bounded=1";

        $.getJSON(NOMINATIM + encodeURIComponent(query.term) + viewbox + bounded, onQueryResult.bind(null, true));
    }
}

export const search = new Search();