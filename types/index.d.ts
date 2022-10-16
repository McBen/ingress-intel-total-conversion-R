/// <reference path="./layerchooser.d.ts" />
/// <reference path="./types.d.ts" />
/// <reference path="./intel.d.ts" />
import * as L from "leaflet";

// TODO remove old interface
// OLD IITC interface ... these should be replaced
declare global {
    function load(name: string): any;
    function dialog(options: any): JQuery;
    function formatPasscodeLong(a: any): any;
    function postAjax(request: string, options: any, callbackA: any, callbackB: any): any;
    function setupPlayerStat(): void;
    function useAppPanes(): boolean;

    interface Window {
        plugin: any;
        bootPlugins: BootCallback[];
        iitcLoaded: boolean;
        map: L.Map;
        layerChooser: L.Control.Layers;
        REDEEM_STATUSES: { [key: number]: string };

        search: {
            setup: () => void
        }
    }

    const script_info: ScriptInfo;

    // Intel
    const PLAYER: {
        team: string;
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
