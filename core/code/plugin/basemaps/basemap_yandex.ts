import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as L1 from "leaflet";

import "leaflet-plugins/layer/tile/Yandex";
import "leaflet-plugins/layer/tile/Yandex.addon.LoadApi";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace L {
    function yandex(options): L1.TileLayer;
}


export class PluginYandexMaps extends Plugin {
    public name = "Yandex maps";
    public version = "0.3.0";
    public description = "Add Yandex.com (Russian/Русский) map layers";
    public author = "johnd0e";
    public tags: ["map", "tiles", "baselayer", "russia"];
    public defaultInactive = true;

    private apiKey = "";

    private sets = {
        map: {
            type: "map"
        },
        satellite: {
            type: "satellite"
        },
        hybrid: {
            type: "hybrid"
        }
    };


    activate(): void {
        const baseOptions = {
            key: this.apiKey
        }

        // eslint-disable-next-line guard-for-in
        for (const name in this.sets) {
            const options = $.extend({}, baseOptions, this.sets[name]);
            const layer = L.yandex(options);
            IITC.layers.addBase("Yandex " + name, layer);
        }
    }

    deactivate(): void {

        // eslint-disable-next-line guard-for-in
        for (const name in this.sets) {
            IITC.layers.removeBase("Yandex " + name);
        }
    }
}

