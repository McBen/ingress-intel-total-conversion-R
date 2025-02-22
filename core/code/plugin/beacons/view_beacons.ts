import * as Chatparser from "../../helper/chatparser";
import { ChatLineType } from "../../helper/chatlines";
import { hooks } from "../../helper/hooks";
import { Plugin } from "../plugin_base";


const enum BeaconType {
    none,
    Anomaly,
    Beacon,
    Fracker,
    Battle,
    RBattle,
    Reward
}

type BeaconNames = { name: string, type: BeaconType }
const beaconNames: { [key: string]: BeaconNames } = {
    "peFRACK": { name: "Fracker", type: BeaconType.Fracker },
    "peENL": { name: "ENL", type: BeaconType.Beacon },
    "peRES": { name: "RES", type: BeaconType.Beacon },
    "peFW_ENL": { name: "Firework (ENL)", type: BeaconType.Beacon },
    "peFW_RES": { name: "Firework (RES)", type: BeaconType.Beacon },
    'peBN_BLM': { name: "Beacon (BLM)", type: BeaconType.Beacon },
    'peBN_ENL_WINNER': { name: "BB - Win-ENL", type: BeaconType.Battle },
    'peBN_RES_WINNER': { name: "BB - Win-RES", type: BeaconType.Battle },
    'peBN_TIED_WINNER': { name: "BB - Win-none", type: BeaconType.Battle },
    'peNEMESIS': { name: "Nemesis", type: BeaconType.Beacon },
    'peTOASTY': { name: "Toasty", type: BeaconType.Beacon },
    'peLOOK': { name: "Target", type: BeaconType.Beacon },
    "sc5_p": { name: "Volatile Scout Controller Portal", type: BeaconType.Anomaly },
    "ap2_start": { name: "Shard Start (2)", type: BeaconType.Anomaly }, /* shard Feb.2024 */
    "ap3_start": { name: "Shard Start (3)", type: BeaconType.Anomaly }, /* shard Feb.2024 */
    "ap4_start": { name: "Shard Start (4)", type: BeaconType.Anomaly }, /* shard Feb.2024 */
    "ap5_start": { name: "Shard Start (5)", type: BeaconType.Anomaly }, /* shard Feb.2024 */
    // "peBN_MHN_LOGO": { name: "Beacon (Monster Hunter)", type: BeaconType.Beacon},
    // 'peBN_PEACE': { name: "Beacon (Peace)", type: BeaconType.Beacon },
    // 'peBN_MEET': { name: "Beacon (Meet)", type: BeaconType.Beacon },
    // 'peBN_VIALUX': { name: "Beacon (ViaLux)", type: BeaconType.Beacon },
    // 'peBN_NIA': { name: "Beacon (Nia)", type: BeaconType.Beacon },
    // 'peBN_LOOK': { name: "Beacon (Look)", type: BeaconType.Beacon },
};
const nameRewardBeacon = "peBR_REWARD-"; // example: peBR_REWARD-10_125_38

const imagePath = "https://commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/";

interface BeaconDeploy {
    player: string;
    time: number;
}

const chatMessages = [ChatLineType.BEACON, ChatLineType.BATTLE, ChatLineType.BATTLE_RESULT, ChatLineType.FIREWORKS];


export class ViewOrnaments extends Plugin {
    public name = "View Beacons";
    public version = "1.0";
    public description = "Show ornaments in portal details";
    public author = "McBen";
    public tags: ["ornaments", "beacon", "portal", "info"];
    public defaultInactive = false;

    private lastDeploy: Map<string, BeaconDeploy> = new Map();

    constructor() {
        super();

        // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
        require("./styles.css");
    }


    activate() {
        hooks.on("portalDetailsUpdated", this.onPortalDetails);
        hooks.chat.on(chatMessages, this.onBeaconChat, true);
    }

    deactivate() {
        hooks.off("portalDetailsUpdated", this.onPortalDetails);
        hooks.chat.off(chatMessages, this.onBeaconChat, true);
    }

    onPortalDetails = (): void => {
        $("#portaldetails #ornaments").remove();
        $("#portaldetails .imgpreview .ornamentsImages").remove();

        const current = selectedPortal;
        if (!current) return;
        const portal = window.portals[current];
        if (!portal) return;
        const ornaments = portal.options.data.ornaments;


        if (ornaments && ornaments.length > 0) {

            const images = this.getOrnamentsImageBlock(ornaments);
            images.addClass("ornamentsImages");
            $("#portaldetails .imgpreview").append(images);

            const deployer = this.getDeployer(portal);
            const ornamentsNames = this.getOrnamentsNames(ornaments, deployer);
            const text = $("<div>", { id: "ornaments", text: ornamentsNames.join(",") });
            $("#portaldetails .mods").after(text);
        }
    }

    private getOrnamentsNames(ornaments: string[], possibleDeployer: string | undefined): string[] {

        return ornaments.map(name => {
            let tname = name
            if (beaconNames[name]) {
                tname = beaconNames[name].name;
            } else if (name.startsWith("pe")) {
                tname = `Beacon (${name.slice(2)})`;
            }

            if (this.beaconHasDeployer(name) && possibleDeployer) {
                return `${tname} by ${possibleDeployer}`;
            }
            return tname;
        });
    }

    private getOrnamentsImageBlock(ornaments: string[]): JQuery {
        const container = $("<div>");

        const deployer = this.getDeployer(window.portals[selectedPortal!]);
        const ornamentsNames = this.getOrnamentsNames(ornaments, deployer);
        ornaments.forEach((name, idx) => {
            container.append($("<img>", { src: imagePath + name + ".png", title: ornamentsNames[idx] }));
        });

        return container;
    }

    private getDeployer(portal: IITC.Portal): string | undefined {
        const llstr = portal.options.data.latE6 + "&" + portal.options.data.lngE6
        const deployer = this.lastDeploy.get(llstr);
        if (!deployer) return;

        return `${deployer.player} ${this.formatTime(deployer.time)}`;
    }

    private formatTime(time: number): string {
        const date = new Date(time);
        if (date.getMinutes() < 10) {
            return `${date.getHours()}:0${date.getMinutes()}`
        } else {
            return `${date.getHours()}:${date.getMinutes()}`
        }
    }

    onBeaconChat = (type: ChatLineType, line: Intel.ChatLine) => {

        const time = Chatparser.getTime(line);

        const portal = Chatparser.getPortal(line);
        const portalStr = portal.latE6 + "&" + portal.lngE6;
        const player = Chatparser.getAgent(line).plain;

        const last = this.lastDeploy.get(portalStr);
        if (!last || time > last.time) {
            this.lastDeploy.set(portalStr, { player, time });
        }
    }

    private beaconHasDeployer(ornamentName: string): boolean {
        const type = this.getBeaconType(ornamentName);
        return type === BeaconType.Beacon || type === BeaconType.Battle || type === BeaconType.Fracker || type === BeaconType.RBattle;
    }

    private getBeaconType(ornamentName: string): BeaconType {

        const knownBeacon = beaconNames[ornamentName];
        if (knownBeacon) {
            return knownBeacon.type;
        }
        if (ornamentName.startsWith(nameRewardBeacon)) return BeaconType.Reward;

        if (ornamentName.startsWith("pe")) return BeaconType.Beacon;
        return !!ornamentName ? BeaconType.Anomaly : BeaconType.none;
    }
}
