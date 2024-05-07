import { IITCr } from "../../IITC";
import { HOURS } from "../../helper/times";
import { Plugin } from "../plugin_base";
import iconEnlImage from "./marker-green.png";
import iconEnlRetinaImage from "./marker-green-2x.png";
import iconResImage from "./marker-blue.png";
import iconResRetinaImage from "./marker-blue-2x.png";
import { COLORS_LVL, DEFAULT_ZOOM, FACTION, FACTION_CSS, FACTION_NAMES, teamStr2Faction } from "../../constants";
import { makePermalink } from "../../helper/utils_misc";
import { selectPortalByLatLng } from "../../map/url_paramater";


interface Player {
    team: FACTION;
    actions: Action[];
    marker?: L.Marker;
}

interface Action {
    time: number;
    latlngs: L.LatLng[];
    name: string,
    address: string

}

export interface TrackerOptions {
    max_time?: number;
    max_steps?: number;
    min_zoom: number;
    min_opacity: number
    line_color: string
}

const DEFAULT_OPTIONS: TrackerOptions = {
    max_time: 3 * HOURS,
    max_steps: undefined,
    min_zoom: 9,
    min_opacity: 0.3,
    line_color: "#FF00FD"
}


// TODO: find better place
const isTouchDevice = (): boolean => {
    return "ontouchstart" in window // works on most browsers
        || "onmsgesturechange" in window; // works on ie10
};

// TODO: convert
declare global {
    function registerMarkerForOMS(marker: L.Marker): void;
    function setupTooltips(element: JQuery): void;
}

// TODO: convert (a Chat Portal helper - window.chat.getChatPortalName)
const getChatPortalName = (name: string, address: string): string => {
    if (name === "US Post Office") {
        const addressLines = address.split(",");
        name = "USPS: " + addressLines[0];
    }
    return name;
};


export class PlayerTracker extends Plugin {
    public name = "Player activity tracker";
    public version = "0.13.1";
    public description = "Draw trails for the path a user took onto the map based on status messages in COMMs. Uses up to three hours of data.";
    public author = "breunigs";
    public tags: ["player", "agent", "track", "stalk", "where"];
    public defaultInactive = false;

    public stored: Map<string, Player>;

    private drawnTracesEnl: L.LayerGroup;
    private drawnTracesRes: L.LayerGroup;
    private playerPopup: L.Popup;
    private iconEnl: L.Icon;
    private iconRes: L.Icon;
    private option: TrackerOptions;

    constructor() {
        super();

        this.stored = new Map();

        // eslint-disable-next-line unicorn/prefer-module
        require("./player-tracker.css");

        this.setOptions();
    }

    activate(): void {
        this.drawnTracesEnl = new L.LayerGroup();
        this.drawnTracesRes = new L.LayerGroup();
        this.iconEnl = new L.Icon({
            iconUrl: iconEnlImage,
            iconRetinaUrl: iconEnlRetinaImage,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        this.iconRes = new L.Icon({
            iconUrl: iconResImage,
            iconRetinaUrl: iconResRetinaImage,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        if (window.PLAYER.team === "RESISTANCE") {
            IITCr.layers.addOverlay("Player Tracker Resistance", this.drawnTracesRes, { default: true });
            IITCr.layers.addOverlay("Player Tracker Enlightened", this.drawnTracesEnl, { default: true });
        } else {
            IITCr.layers.addOverlay("Player Tracker Enlightened", this.drawnTracesEnl, { default: true });
            IITCr.layers.addOverlay("Player Tracker Resistance", this.drawnTracesRes, { default: true });
        }

        this.playerPopup = new L.Popup({ offset: L.point([1, -34]) });

        IITCr.hooks.on("publicChatDataAvailable", this.onHandleData);

        window.map.on("zoomend", this.onZoom);
        this.onZoom();

        IITCr.hooks.on("nicknameClicked", this.onNicknameClicked);
        IITCr.hooks.on("search", this.onSearch);
    }


    deactivate(): void {
        IITCr.layers.removeOverlay(this.drawnTracesRes);
        IITCr.layers.removeOverlay(this.drawnTracesEnl);

        window.map.off("zoomend", this.onZoom);
        IITCr.hooks.off("publicChatDataAvailable", this.onHandleData);
        IITCr.hooks.off("nicknameClicked", this.onNicknameClicked);
        IITCr.hooks.off("search", this.onSearch);
    }

    setOptions(options?: Partial<TrackerOptions>) {
        if (options) {
            this.option = { ...this.option, ...options };
        } else {
            this.option = { ...DEFAULT_OPTIONS };
        }
    }


    reset() {
        this.stored.clear();
        this.drawnTracesEnl.clearLayers();
        this.drawnTracesRes.clearLayers();
    }

    onZoom = (): void => {
        this.zoomListener();
    }


    onClickListener = (event: L.LeafletMouseEvent): void => {
        const marker = event.target as L.Marker;
        const desc = (<any>marker.options).desc as string
        if (desc) {
            this.playerPopup.setContent(desc);
            this.playerPopup.setLatLng(marker.getLatLng());
            window.map.openPopup(this.playerPopup);
        }
    }

    zoomListener = (): void => {
        if (window.map.getZoom() < this.option.min_zoom) {
            this.drawnTracesEnl.clearLayers();
            this.drawnTracesRes.clearLayers();
        }
    }

    private getLimit() {
        return this.option.max_time ? Date.now() - this.option.max_time : 0;
    }

    private discardOldData() {
        if (this.option.max_steps) {
            this.stored.forEach(player => {
                if (player.actions.length > this.option.max_steps) {
                    player.actions = player.actions.slice(-this.option.max_steps);
                }
            })
        } else {
            const limit = this.getLimit();
            this.stored.forEach((player, plrname) => {
                player.actions = player.actions.filter(event => event.time >= limit);
                if (player.actions.length === 0) {
                    this.stored.delete(plrname);
                }
            });
        }
    }

    private eventHasLatLng(action: Action, latLng: L.LatLng) {
        return action.latlngs.includes(latLng);
    }

    private processNewData(data: Intel.ChatCallback) {
        const limit = this.getLimit();

        // Destroy link and field messages depend on where the link or
        // field was originally created. Therefore it’s not clear which
        // portal the player is at, so ignore it.
        const ignoreMessages = new Set([
            " destroyed the ", "Your Link ",
            " destroyed the Link ", " destroyed a Control Field @" // old messages
        ]);

        data.result.forEach(chat => {
            // skip old data
            if (chat[1] < limit) return;

            // find player and portal information
            let plrname: string;
            let plrteam: FACTION;
            let latLng: L.LatLng;
            let address: string;
            let name: string;
            let skipThisMessage = false;


            chat[2].plext.markup.every(markup => {
                switch (markup[0]) {
                    case "TEXT":
                        if (ignoreMessages.has(markup[1].plain)) {
                            skipThisMessage = true;
                            return false;
                        }
                        break;
                    case "PLAYER":
                        plrname = markup[1].plain;
                        plrteam = teamStr2Faction(markup[1].team);
                        break;
                    case "PORTAL":
                        // link messages are “player linked X to Y” and the player is at X.
                        latLng = latLng ?? L.latLng(markup[1].latE6 / 1e6, markup[1].lngE6 / 1e6);

                        name = name ?? markup[1].name;
                        address = address ?? markup[1].address;
                        break;
                }
                return true;
            });

            // skip unusable events
            if (skipThisMessage || !latLng || !plrname || ![FACTION.ENL, FACTION.RES].includes(plrteam)) return;
            if (plrname === "NiaSection14") return;

            const newEvent: Action = {
                latlngs: [latLng],
                time: chat[1],
                name,
                address
            };

            const playerData = this.stored.get(plrname);

            // short-path if this is a new player
            if (!playerData || playerData.actions.length === 0) {
                this.stored.set(plrname, {
                    team: plrteam,
                    actions: [newEvent]
                });
                return;
            }

            const actions = playerData.actions;
            // there’s some data already. Need to find correct place to insert.
            let i: number;
            for (i = 0; i < actions.length; i++) {
                if (actions[i].time > chat[1]) break;
            }

            const cmp = Math.max(i - 1, 0);

            // so we have an event that happened at the same time. Most likely
            // this is multiple resos destroyed at the same time.
            if (actions[cmp].time === chat[1]) {
                actions[cmp].latlngs.push(latLng);
                return;
            }

            // the time changed. Is the player still at the same location?

            // assume this is an older event at the same location. Then we need
            // to look at the next item in the event list. If this event is the
            // newest one, there may not be a newer event so check for that. If
            // it really is an older event at the same location, then skip it.
            if (actions[cmp + 1] && this.eventHasLatLng(actions[cmp + 1], latLng)) return;

            // if this event is newer, need to look at the previous one
            const sameLocation = this.eventHasLatLng(actions[cmp], latLng);

            // if it’s the same location, just update the timestamp. Otherwise
            // push as new event.
            if (sameLocation) {
                actions[cmp].time = chat[1];
            } else {
                actions.splice(i, 0, newEvent);
            }
        });
    }

    private getLatLngFromEvent(action: Action): L.LatLng {
        const latLng = action.latlngs.reduce((sum, ll) => [sum[0] + ll.lat, sum[1] + ll.lng], [0, 0]);
        return L.latLng(latLng[0] / action.latlngs.length, latLng[1] / action.latlngs.length);
    }

    private ago(time: number, now: number) {
        const s = (now - time) / 1000;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        if (h > 0) {
            return `${h}h${m}m`;
        } else {
            return `${m}m`;
        }
    }

    private drawData() {
        // eslint-disable-next-line unicorn/prevent-abbreviations
        const isTouchDev = isTouchDevice();

        const polyLineByAgeEnl: [L.LatLng[][], L.LatLng[][], L.LatLng[][], L.LatLng[][]] = [[], [], [], []];
        const polyLineByAgeRes: [L.LatLng[][], L.LatLng[][], L.LatLng[][], L.LatLng[][]] = [[], [], [], []];

        const split = this.option.max_time ? 4 / this.option.max_time : 0;
        const now = Date.now();
        this.stored.forEach((playerData, plrname) => {
            if (!playerData || playerData.actions.length === 0) {
                console.warn("broken player data for plrname=" + plrname);
                return true;
            }

            // gather line data and put them in buckets so we can color them by
            // their age
            for (let i = 1; i < playerData.actions.length; i++) {
                const p = playerData.actions[i];
                const ageBucket = Math.min(Math.ceil((now - p.time) * split), 4 - 1);
                const line = [this.getLatLngFromEvent(p), this.getLatLngFromEvent(playerData.actions[i - 1])];

                if (playerData.team === FACTION.RES) {
                    polyLineByAgeRes[ageBucket].push(line);
                } else {
                    polyLineByAgeEnl[ageBucket].push(line);
                }
            }

            const evtsLength = playerData.actions.length;
            const last = playerData.actions[evtsLength - 1];

            // tooltip for marker - no HTML - and not shown on touchscreen devices
            const tooltip = isTouchDev ? "" : (plrname + ", " + this.ago(last.time, now) + " ago");

            // popup for marker
            const popup = this.createPopup(plrname, playerData);

            // marker opacity
            const relativeOpacity = this.option.max_time ? 1 - (now - last.time) / this.option.max_time : 1;
            const absOpacity = this.option.min_opacity + (1 - this.option.min_opacity) * relativeOpacity;

            // marker itself
            const icon = playerData.team === FACTION.RES ? this.iconRes : this.iconEnl;
            // as per OverlappingMarkerSpiderfier docs, click events (popups, etc) must be handled via it rather than the standard
            // marker click events. so store the popup text in the options, then display it in the oms click handler
            const m = L.marker(this.getLatLngFromEvent(last), { icon, opacity: absOpacity, desc: popup[0], title: tooltip } as L.MapOptions);
            m.addEventListener("spiderfiedclick", this.onClickListener);

            // m.bindPopup(title);


            playerData.marker = m;

            m.addTo(playerData.team === FACTION.RES ? this.drawnTracesRes : this.drawnTracesEnl);
            window.registerMarkerForOMS(m);
        });

        // draw the poly lines to the map
        polyLineByAgeEnl.forEach((polyLine, i) => {
            if (polyLine.length === 0) return true;

            const options = {
                weight: 2 - 0.25 * i,
                color: this.option.line_color,
                interactive: false,
                opacity: 1 - 0.2 * i,
                dashArray: "5,8"
            };

            polyLine.forEach(poly => {
                L.polyline(poly, options).addTo(this.drawnTracesEnl);
            });
        });
        polyLineByAgeRes.forEach((polyLine, i) => {
            if (polyLine.length === 0) return true;

            const options = {
                weight: 2 - 0.25 * i,
                color: this.option.line_color,
                interactive: false,
                opacity: 1 - 0.2 * i,
                dashArray: "5,8"
            };

            polyLine.forEach(poly => {
                L.polyline(poly, options).addTo(this.drawnTracesRes);
            });
        });
    }

    private createPopup(plrname: string, playerData: Player): JQuery {

        const evtsLength = playerData.actions.length;
        const last = playerData.actions[evtsLength - 1];
        const now = Date.now();

        const popup = $("<div>")
            .addClass("plugin-player-tracker-popup");
        $("<span>")
            .addClass("nickname " + FACTION_CSS[playerData.team])
            .css("font-weight", "bold")
            .text(plrname)
            .appendTo(popup);

        this.popupAppendPlayerLevelGuess(popup, plrname);

        popup
            .append("<br>")
            .append(document.createTextNode(this.ago(last.time, now)))
            .append("<br>")
            .append(this.getPortalLink(last));

        // show previous data in popup
        if (evtsLength >= 2) {
            popup
                .append("<br>")
                .append("<br>")
                .append(document.createTextNode("previous locations:"))
                .append("<br>");

            const table = $("<table>")
                .appendTo(popup)
                .css("border-spacing", "0");
            for (let i = evtsLength - 2; i >= 0 && i >= evtsLength - 10; i--) {
                const action = playerData.actions[i];
                $("<tr>")
                    .append($("<td>")
                        .text(this.ago(action.time, now) + " ago"))
                    .append($("<td>")
                        .append(this.getPortalLink(action)))
                    .appendTo(table);
            }
        }

        return popup;
    }

    private popupAppendPlayerLevelGuess(popup: JQuery, plrname: string): void {
        const guessPlayerLevels = window.plugin.guessPlayerLevels;

        if (guessPlayerLevels === undefined || guessPlayerLevels.fetchLevelDetailsByPlayer === undefined) return;

        // eslint-disable-next-line no-inner-declarations
        const getLevel = (lvl: number): JQuery => {
            return $("<span>")
                .css({
                    padding: "4px",
                    color: "white",
                    backgroundColor: COLORS_LVL[lvl]
                })
                .text(lvl);
        }

        const level = $("<span>")
            .css({ "font-weight": "bold", "margin-left": "10px" })
            .appendTo(popup);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const playerLevelDetails = guessPlayerLevels.fetchLevelDetailsByPlayer(plrname) as { min: number, guessed: number };
        level
            .text("Min level ")
            .append(getLevel(playerLevelDetails.min));
        if (playerLevelDetails.min !== playerLevelDetails.guessed) {
            level
                .append(document.createTextNode(", guessed level: "))
                .append(getLevel(playerLevelDetails.guessed));
        }
    }


    private getPortalLink(data: Action) {
        const position = data.latlngs[0];
        const portalName = getChatPortalName(data.name, data.address);

        return $("<a>")
            .addClass("text-overflow-ellipsis")
            .css("max-width", "15em")
            .text(portalName)
            .prop({
                title: portalName,
                href: makePermalink(position)
            })
            .on("click", (event: JQuery.ClickEvent) => {
                selectPortalByLatLng(position);
                event.preventDefault();
                return false;
            })
            .on("dblclick", (event: JQuery.DoubleClickEvent) => {
                window.map.setView(position, DEFAULT_ZOOM);
                selectPortalByLatLng(position);
                event.preventDefault();
                return false;
            });
    }

    onHandleData = (data: Intel.ChatCallback): void => {
        if (window.map.getZoom() < this.option.min_zoom) return;

        this.discardOldData();
        this.processNewData(data);

        this.drawnTracesEnl.clearLayers();
        this.drawnTracesRes.clearLayers();
        this.drawData();
    }

    private findUser(nick: string): Player | undefined {
        nick = nick.toLowerCase();

        const name = [...this.stored.keys()].find(n => n.toLowerCase() === nick)
        return this.stored.get(name);
    }

    private centerMapOnUser(nick: string): boolean {
        const data = this.findUser(nick);
        if (!data) return false;

        const last = data.actions.at(-1);
        const position = this.getLatLngFromEvent(last);

        if (window.isSmartphone()) window.show("map");
        window.map.setView(position, window.map.getZoom());

        if (data.marker) {
            this.onClickListener({ target: data.marker } as L.LeafletMouseEvent);
        }
        return true;
    }

    onNicknameClicked = (info: { event: MouseEvent, nickname: string }): boolean => {
        if (info.event.ctrlKey || info.event.metaKey) {
            return !this.centerMapOnUser(info.nickname);
        }
        return true; // don't interrupt hook
    }

    onSearchResultSelected = (result: IITC.SearchResultPosition, event: MouseEvent) => {
        event.stopPropagation(); // prevent chat from handling the click

        if (window.isSmartphone()) window.show("map");

        // if the user moved since the search was started, check if we have a new set of data
        if (false === this.centerMapOnUser((<any>result).nickname as string)) {
            window.map.setView(result.position);
        }

        if (event.type === "dblclick") {
            window.map.setZoom(DEFAULT_ZOOM);
        }

        return true;
    };

    onSearch = (query: IITC.SearchQuery) => {
        let term = query.term.toLowerCase();

        if (term.length > 0 && term[0] === "@") term = term.slice(1);

        this.stored.forEach((data, nick) => {
            if (!nick.toLowerCase().includes(term)) return;

            const event = data.actions.at(-1);
            const faction = FACTION_NAMES[data.team].slice(0, 3).toUpperCase();
            const lastTime = new Date(event.time).toLocaleString(navigator.languages);

            query.addResult({
                title: '<mark class="nickname help ' + FACTION_CSS[data.team] + '">' + nick + "</mark>",
                nickname: nick,
                description: `${faction}, last seen ${lastTime}`,
                position: this.getLatLngFromEvent(event),
                onSelected: this.onSearchResultSelected
            } as IITC.SearchResultPosition);
        });
    }
}