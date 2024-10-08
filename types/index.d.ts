/* eslint-disable unicorn/prevent-abbreviations */
/// <reference path="./layerchooser.d.ts" />
/// <reference path="./types.d.ts" />
/// <reference path="./constants.d.ts" />
/// <reference path="./leaflet_extentions/index.d.ts" />
import { FACTION } from "../core/code/constants.js";
import "./intel.d.ts";
import * as L from "leaflet";


type PortalGUID = string;
type LinkGUID = string;
type FieldGUID = string;
type TileID = string;


// TODO remove old interface
// OLD IITC interface ... these should be replaced
declare global {

    function load(name: string): any;
    function formatPasscodeLong(a: any): any;
    function setupPlayerStat(): void;
    function useAppPanes(): boolean;
    function renderUpdateStatus(): void;
    function teamStringToId(faction: string): FACTION;
    function show(paneID: string): void;
    function isSmartphone(): boolean;

    interface Window {

        // Options for 3rd Party
        RENDERER_PADDING: number | undefined;
        PREFER_CANVAS: boolean | undefined;
        mapOptions: L.MapOptions;

        isApp: boolean | undefined;
        plugin: any;
        bootPlugins: BootCallback[];
        iitcLoaded: boolean;
        map: L.Map;
        layerChooser: LayerChooser;

        urlPortalLL: [number, number];
        urlPortal: PortalGUID;

        search: {
            setup: () => void
        }

        /** list of all loaded portals */
        portals: { [guid: string /* PortalGUID */]: IITC.Portal };

        /** list of all loaded links */
        links: { [guid: string /* LinkGUID */]: IITC.Link };

        /** list of all fields */
        fields: { [guid: string /* FieldGUID */]: IITC.Field };

        TILE_PARAMS: {
            ZOOM_TO_LINK_LENGTH: number[];
            ZOOM_TO_LEVEL: number[],
            TILES_PER_EDGE: number[]
        }

        ornaments: {
            addPortal: (p: IITC.Portal) => void,
            removePortal: (p: IITC.Portal) => void
        }
    }

    type DecodePortalDetails = "core" | "summary" | "detailed" | "extended" | "anyknown";
    const decodeArray: {
        portal: (a: IITC.EntityPortalDetailed, kind: DecodePortalDetails) => IITC.PortalData | IITC.PortalDataDetail
    }

    const niantic_params: {
        ZOOM_TO_LEVEL?: number[],
        TILES_PER_EDGE?: number[],
        CURRENT_VERSION: string
    }

    /** guid of current selected portal */
    let selectedPortal: PortalGUID | undefined;
    let urlPortal: PortalGUID | undefined;
    let urlPortalLL: [number, number] | undefined;

    const script_info: ScriptInfo;

    // eslint-disable-next-line id-blacklist
    interface String {
        capitalize(): string;
    }

}


type BootCallback = { (): void; info: ScriptInfo };
export interface ScriptInfo {
    buildName: string; // buildname (ex: "local")
    dateTimeVersion: string; // build time (sub version)
    pluginId: string; // unique ID (used in App)
    error?: string; // error text if "setup" call failed
    script: {
        version: string,
        name: string,
        description: string
    }
}