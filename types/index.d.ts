/// <reference path="./layerchooser.d.ts" />
/// <reference path="./types.d.ts" />
import * as L from "leaflet";

// TODO remove old interface
// OLD IITC interface ... these should be replaced
declare global {
    function aboutIITC(): void;
    function load(name: string): any;
    function dialog(options: any): JQuery;
    function formatPasscodeLong(a: any): any;
    function postAjax(request: string, options: any, callbackA: any, callbackB: any): any;
    function setupPlayerStat(): void;

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

        RegionScoreboard: {
            setup: () => void,
            showDialog: () => void
        }

    }

}

type BootCallback = () => void;
