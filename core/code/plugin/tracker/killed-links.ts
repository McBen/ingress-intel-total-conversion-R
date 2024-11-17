import { ChatLineType } from "../../helper/chatlines";
import { hooks } from "../../helper/hooks";
import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as Chat from "../../helper/chatlines";
import * as ChatParse from "../../helper/chatparser";
import { FACTION } from "../../constants";

const enum LAYER {
    KILLED_ENL = 0,
    KILLED_RES = 1,
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



    activate(): void {
        this.links = new Map();

        this.layers = [];
        this.layers[LAYER.KILLED_ENL] = new L.LayerGroup();
        this.layers[LAYER.KILLED_RES] = new L.LayerGroup();
        IITCr.layers.addOverlay("Killed\\Links by ENL", this.layers[LAYER.KILLED_ENL], { default: true });
        IITCr.layers.addOverlay("Killed\\Links by RES", this.layers[LAYER.KILLED_RES], { default: true });

        hooks.chat.on(ChatLineType.DESTROY_LINK, this.onLinkDestoyed, true);
        hooks.chat.on(ChatLineType.DESTROY_RESONATOR, this.onResoDestoyed, true);
    }


    deactivate(): void {
        IITCr.layers.removeOverlay(this.layers[LAYER.KILLED_ENL]);
        IITCr.layers.removeOverlay(this.layers[LAYER.KILLED_RES]);

        hooks.chat.off(ChatLineType.DESTROY_LINK, this.onLinkDestoyed, true);
        hooks.chat.off(ChatLineType.DESTROY_RESONATOR, this.onResoDestoyed, true);

        (this.links as any) = undefined;
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
    }

    onResoDestoyed = (_type: Chat.ChatLineType, _line: Intel.ChatLine) => {
        /** FILLME */
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

}
