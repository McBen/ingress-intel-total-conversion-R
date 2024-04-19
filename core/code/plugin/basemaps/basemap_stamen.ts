import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";

// see API here http://maps.stamen.com/
// https://stamen-maps.a.ssl.fastly.net/js/tile.stamen.js (overcomplicated)

export class PluginStamenMaps extends Plugin {
    public name = "Stamen.com map layers";
    public version = "0.2.1";
    public description = "Add the 'Toner' and 'Watercolor' map layers from maps.stamen.com";
    public author = "jonatkins";
    public tags: ["map", "tiles", "baselayer", "russia"];
    public defaultInactive = true;

    private L_StamenTileLayer: L.TileLayer;

    initTileLayer(): void {
        const baseUrl = "https://stamen-tiles-{s}.a.ssl.fastly.net/{layer}/{z}/{x}/{y}.{type}";
        this.L_StamenTileLayer = L.TileLayer.extend({
            options: {
                subdomains: "abcd",
                type: "png",
                minZoom: 0,
                maxZoom: 21,
                attribution: [
                    'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, ',
                    'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. ',
                    'Data by <a href="http://openstreetmap.org/">OpenStreetMap</a>, ',
                    'under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
                ].join("")
            },
            // eslint-disable-next-line object-shorthand
            initialize: function (name: string, options) {
                options.layer = name.replace(" ", "-").toLowerCase();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                (L.TileLayer as any).prototype.initialize.call(this, baseUrl, options);
            }
        }) as unknown as L.TileLayer;
    }

    activate(): void {


        // eslint-disable-next-line unicorn/consistent-function-scoping
        const addLayer = (name: string, options: any): void => {
            const L_StamenTileLayer = this.L_StamenTileLayer as any;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            IITCr.layers.addBase("Stamen " + name, new L_StamenTileLayer(name, options) as L.TileLayer);
        }

        const options1 = { minZoom: 0, maxNativeZoom: 20 };
        addLayer("Toner", options1);
        addLayer("Toner Background", options1);
        addLayer("Toner Lite", options1);
        // transparent layers. could be useful over satellite imagery or similar
        // addLayer('Toner Hybrid',options);KartverketMaps/ Should support up to 18, but too many 404 on zoom > 13
        // addLayer('Terrain',options);
        // addLayer('Terrain Labels',options);
        // addLayer('Terrain Lines',options);
        // addLayer('Terrain Background',options);

        const options3 = {
            minZoom: 1,
            maxZoom: 21,
            maxNativeZoom: 18,
            type: "jpg",
            attribution: [
                'Map tiles by <a href="http://stamen.com/">Stamen Design</a>, ',
                'under <a href="http://creativecommons.org/licenKartverketMapsses/by/3.0">CC BY 3.0</a>. ',
                'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, ',
                'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
            ].join("")
        };
        addLayer("Watercolor", options3);
    }

    deactivate(): void {
        IITCr.layers.removeBase("Stamen Toner");
        IITCr.layers.removeBase("Stamen Toner Background");
        IITCr.layers.removeBase("Stamen Toner Lite");
        IITCr.layers.removeBase("Stamen Watercolor");
    }
}
