/* eslint-disable unicorn/prevent-abbreviations */
/// <reference path="./layerchooser.d.ts" />
/// <reference path="./types.d.ts" />
/// <reference path="./intel.d.ts" />
/// <reference path="./constants.d.ts" />
import * as L from "leaflet";


type PortalGUID = string;
type LinkGUID = string;
type FieldGUID = string;
type TileID = string;


// TODO remove old interface
// OLD IITC interface ... these should be replaced
declare global {
    function load(name: string): any;
    function dialog(options: any): JQuery;
    function formatPasscodeLong(a: any): any;
    function postAjax(request: string, options: any, callbackA: any, callbackB: any): any;
    function setupPlayerStat(): void;
    function useAppPanes(): boolean;
    function renderPortalDetails(guid: PortalGUID | null): void;
    function renderUpdateStatus(): void;
    function resetHighlightedPortals(): void;
    function portalMarkerScale(): number;

    function addHook(event: string, callback: (data: any) => void);
    function runHooks(event: string, data: any): void;

    interface Window {
        isApp: boolean | undefined;
        plugin: any;
        bootPlugins: BootCallback[];
        iitcLoaded: boolean;
        map: L.Map;
        layerChooser: L.Control.Layers;
        REDEEM_STATUSES: { [key: number]: string };

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
    }

    const artifact: {
        getArtifactEntities: () => { [index: string]: IITC.Portal };
    }

    const niantic_params: {
        ZOOM_TO_LEVEL?: number[],
        TILES_PER_EDGE?: number[]
    }

    const portalsFactionLayers: L.LayerGroup[][];
    const linksFactionLayers: L.LayerGroup[];
    const fieldsFactionLayers: L.LayerGroup[];

    /** guid of current selected portal */
    let selectedPortal: PortalGUID | null;

    const script_info: ScriptInfo;
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
