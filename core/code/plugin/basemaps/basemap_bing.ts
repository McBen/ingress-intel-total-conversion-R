import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as L1 from "leaflet";

import "leaflet-plugins/layer/tile/Bing";
import "leaflet-plugins/layer/tile/Bing.addon.applyMaxNativeZoom";

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace L {
    function bingLayer(options: any): L1.TileLayer;
}


export class PluginBingMaps extends Plugin {
    public name = "Bing maps";
    public version = "0.3.0";
    public description = "Add the bing.com map layers.";
    public author = "johnd0e";
    public tags: ["map", "tiles", "baselayer", "microsoft"];
    public defaultInactive = true;

    private apiKey = "Ajt5lr3kR35OADGQqFzptNJA3tXzXYpZoCOSnY1JgGf4tEyWBErROgnuK5V9vYEE";

    private sets: Record<string, Object> = {
        Road: {
            imagerySet: "RoadOnDemand"
        },
        Dark: {
            imagerySet: "CanvasDark"
        },
        Aerial: {
            imagerySet: "Aerial"
        },
        Hybrid: {
            imagerySet: "AerialWithLabelsOnDemand"
        }
    };


    activate(): void {
        const baseOptions = {
            key: this.apiKey
        }

        // eslint-disable-next-line guard-for-in
        for (const name in this.sets) {
            const options = $.extend({}, baseOptions, this.sets[name]);
            const layer = L.bingLayer(options);
            IITCr.layers.addBase("Bing " + name, layer);
        }
    }

    deactivate(): void {

        // eslint-disable-next-line guard-for-in
        for (const name in this.sets) {
            IITCr.layers.removeBase("Bing " + name);
        }
    }
}
