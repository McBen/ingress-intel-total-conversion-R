import { ChatLineType } from "../../helper/chatlines";
import { hooks } from "../../helper/hooks";
import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as Chat from "../../helper/chatlines";
import * as ChatParse from "../../helper/chatparser";
import { FACTION } from "../../constants";
import ICON_ENL from "./flip_ENL.png";
import ICON_RES from "./flip_RES.png";

const enum LAYER {
    KILLED_ENL = 0,
    KILLED_RES = 1,
    FLIPPED_ENL = 0,
    FLIPPED_RES = 1,
}

interface LinkData {
    time: number;
    location: L.LatLng[];
    agent: string;
    team: FACTION
}


export class KilledLinks extends Plugin {
    public name = "Killed Links tracker";
    public version = "1.0.0";
    public description = "Show killed links";
    public author = "McBen";
    public tags: ["player", "agent", "track", "links", "killed", "defense"];
    public defaultInactive = false;

    private layers: L.LayerGroup[];
    private links: Map<string, LinkData>;
    private resoKill: Map<number, string[]>;


    activate(): void {
        this.links = new Map();
        this.resoKill = new Map();

        this.layers = [];
        this.layers[LAYER.KILLED_ENL] = new L.LayerGroup();
        this.layers[LAYER.KILLED_RES] = new L.LayerGroup();
        IITCr.layers.addOverlay("Killed\\Links by ENL", this.layers[LAYER.KILLED_ENL], { default: true });
        IITCr.layers.addOverlay("Killed\\Links by RES", this.layers[LAYER.KILLED_RES], { default: true });

        this.layers[LAYER.FLIPPED_ENL] = new L.LayerGroup();
        this.layers[LAYER.FLIPPED_RES] = new L.LayerGroup();
        IITCr.layers.addOverlay("Killed\\Flip by ENL", this.layers[LAYER.FLIPPED_ENL], { default: true });
        IITCr.layers.addOverlay("Killed\\Flip by RES", this.layers[LAYER.FLIPPED_RES], { default: true });

        hooks.chat.on(ChatLineType.DESTROY_LINK, this.onLinkDestoyed, true);
        hooks.chat.on(ChatLineType.DESTROY_RESONATOR, this.onResoDestoyed, true);
        hooks.chat.on(ChatLineType.UPDATE_DONE, this.onChatDone, true);
    }


    deactivate(): void {
        this.layers.forEach(l => IITCr.layers.removeOverlay(l));
        this.layers = [];

        hooks.chat.off(ChatLineType.DESTROY_LINK, this.onLinkDestoyed, true);
        hooks.chat.off(ChatLineType.DESTROY_RESONATOR, this.onResoDestoyed, true);
        hooks.chat.off(ChatLineType.UPDATE_DONE, this.onChatDone, true);

        // free memory
        (this.links as any) = undefined;
        (this.resoKill as any) = undefined;
    }


    onLinkDestoyed = (_type: Chat.ChatLineType, line: Intel.ChatLine) => {
        const guid = ChatParse.getGuid(line);
        const time = ChatParse.getTime(line);
        const agent = ChatParse.getAgent(line);
        const team = teamStringToId(agent.team);

        const portal_from = ChatParse.getPortal(line);
        const portal_to = ChatParse.getPortal(line, 1);
        const pos1 = L.latLng([portal_from.latE6 / 1e6, portal_from.lngE6 / 1e6]);
        const pos2 = L.latLng([portal_to.latE6 / 1e6, portal_to.lngE6 / 1e6]);

        this.addKilledLink(guid, {
            time,
            location: [pos1, pos2],
            agent: agent.plain,
            team
        });

        if (ChatParse.getTeam(line) === team) {
            this.addVirus(pos1, team);
        }
    }


    onResoDestoyed = (_type: Chat.ChatLineType, line: Intel.ChatLine) => {
        const time = ChatParse.getTime(line);
        const agent = ChatParse.getAgent(line);
        const portal = ChatParse.getPortal(line);
        const pos1 = L.latLng([portal.latE6 / 1e6, portal.lngE6 / 1e6]);
        const team = teamStringToId(agent.team);

        if (team === ChatParse.getTeam(line)) {
            this.addVirus(pos1, team);
            return;
        }

        const kills = this.resoKill.get(time);
        if (kills && kills.includes(agent.plain)) {
            this.addVirus(pos1, team);
            return;
        }

        if (kills) {
            kills.push(agent.plain);
        } else {
            this.resoKill.set(time, [agent.plain]);
        }
    }

    onChatDone = () => {
        // only keep it while update
        this.resoKill.clear();
    }


    private addKilledLink(guid: string, linkData: LinkData) {
        if (this.links.has(guid)) return;

        this.links.set(guid, linkData);
        this.showLink(linkData);
    }

    private showLink(link: LinkData) {

        const options = {
            weight: 4,
            color: "#f1936d",
            clickable: false, // Leaflet v0.7
            interactive: false, // Leaflet v1.0
            opacity: 0.7,
            dashArray: "4,8"
        };

        const line = L.geodesicPolyline(link.location, options);
        const layer = link.team === FACTION.ENL ? LAYER.KILLED_ENL : LAYER.KILLED_RES;
        this.layers[layer].addLayer(line);
    }


    private addVirus(position: L.LatLng, team: number) {
        // addFlipped(position: L.LatLng, team: number, player: string, time: number) {

        // const new_tooltip = `Flipped: ${new Date(time).toLocaleTimeString()} by <span class="${TEAM_TO_CSS[team]}">${player}</span>`;

        /*
        const guid = position.lat + "," + position.lng;
        const old_marker = this.drawnMarkers.get(guid) as MyMarker;
        if (old_marker) {
            const tooltip = old_marker.getPopup().getContent() + "<br>" + new_tooltip;
            old_marker.setPopupContent(tooltip);
            old_marker.link_count++;
            return;
        }
        */

        const icon = team === FACTION.ENL ? ICON_ENL : ICON_RES;
        const marker = L.marker(position, <any>{
            icon: icon,
            interactive: false
        });

        // marker.bindPopup(new_tooltip, { className: "ui-tooltip" });

        /*marker.on("click", (e: L.LeafletMouseEvent) => {
            const eguid = window.findPortalGuidByPositionE6(e.latlng.lat * 1e6, e.latlng.lng * 1e6);
            if (eguid) window.renderPortalDetails(eguid);
        });
        */


        const layer = team === FACTION.ENL ? LAYER.FLIPPED_ENL : LAYER.FLIPPED_RES;
        this.layers[layer].addLayer(marker);
    }
}
