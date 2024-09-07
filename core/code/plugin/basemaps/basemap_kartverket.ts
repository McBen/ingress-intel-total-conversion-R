/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";

export class PluginKartverketMaps extends Plugin {
    public name = "Kartverket.no maps (Norway)";
    public version = "0.2.1";
    public description = "Add Kartverket.no map layers";
    public author = "johnd0e";
    public tags: ["map", "tiles", "baselayer", "norway"];
    public defaultInactive = true;


    initTileLayer(): void {
        (L.TileLayer as any).Kartverket = L.TileLayer.extend({

            baseUrl: "https://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?"
                + "layers={layer}&zoom={z}&x={x}&y={y}",

            options: {
                maxNativeZoom: 18,
                attribution: '&copy; <a href="http://kartverket.no">Kartverket</a>',
                subdomains: ["", "2", "3"]
            },

            mappings: {
                kartdata2: "topo4",
                matrikkel_bakgrunn: "matrikkel_bakgrunn2",
                norgeskart_bakgrunn: "topo4",
                sjo_hovedkart2: "sjokartraster",
                toporaster: "toporaster3",
                topo2: "topo4",
                topo2graatone: "topo4graatone"
            },

            layers: {
                matrikkel_bakgrunn2: "Matrikkel bakgrunn",
                topo4: "Topografisk norgeskart",
                topo4graatone: "Topografisk norgeskart gråtone",
                europa: "Europakart",
                toporaster3: "Topografisk norgeskart, raster",
                sjokartraster: "Sjøkart hovedkartserien",
                norges_grunnkart: "Norges Grunnkart",
                norges_grunnkart_graatone: "Norges grunnkart gråtone",
                egk: "Europeiske grunnkart",
                terreng_norgeskart: "Terreng",
                havbunn_grunnkart: "Havbunn grunnkart",
                // eslint-disable-next-line unicorn/no-null
                bakgrunnskart_forenklet: null
            },

            // eslint-disable-next-line object-shorthand
            initialize: function (layer: string, options: any) {
                if (typeof this.layers[layer] === "undefined") {
                    if (this.mappings[layer]) {
                        layer = this.mappings[layer];
                    } else {
                        throw new Error(`Unknown layer "${layer}"`);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                (L.TileLayer as any).prototype.initialize.call(this, this.baseUrl, options);
                this.options.layer = layer;
            }
        });

        (L.tileLayer as any).kartverket = (layer: string, options: any): L.TileLayer => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            return new (L.TileLayer as any).Kartverket(layer, options);
        };

        (L.tileLayer as any).kartverket.getLayers = (): { [index: string]: string } => {
            return L.extend({}, (L.TileLayer as any).Kartverket.prototype.layers);
        };
    }


    activate(): void {

        this.initTileLayer();

        const kartverket = (L.tileLayer as any).kartverket;
        const layers = kartverket.getLayers();

        // eslint-disable-next-line guard-for-in
        for (const layerID in layers) {
            const name = layers[layerID];
            const layer = kartverket(layerID);
            IITCr.layers.addBase(name, layer);
        }
    }


    deactivate(): void {

        const kartverket = (L.tileLayer as any).kartverket;
        const layers = kartverket.getLayers();

        // eslint-disable-next-line guard-for-in
        for (const layerID in layers) {
            IITCr.layers.removeBase(layers[layerID]);
        }
    }
}



