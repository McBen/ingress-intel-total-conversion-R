import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as L1 from "leaflet";

import "leaflet-plugins/layer/tile/Yandex";
import "leaflet-plugins/layer/tile/Yandex.addon.LoadApi";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace L {
    function yandex(options: any): L1.TileLayer;
}


export class PluginYandexMaps extends Plugin {
    public name = "Yandex maps";
    public version = "0.3.0";
    public description = "Add Yandex.com (Russian/Русский) map layers";
    public author = "johnd0e";
    public tags: ["map", "tiles", "baselayer", "russia"];
    public defaultInactive = true;

    private apiKey = "";

    private sets: Record<string, Object> = {
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

        for (const name in this.sets) {
            const options = $.extend({}, baseOptions, this.sets[name]);
            const layer = L.yandex(options);
            IITCr.layers.addBase("Yandex " + name, layer);
        }
    }

    deactivate(): void {
        for (const name in this.sets) {
            IITCr.layers.removeBase("Yandex " + name);
        }
    }
}

