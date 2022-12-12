/* eslint-disable object-shorthand */
import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


// sample tile: https://webrd01.is.autonavi.com/appmaptile?style=8&x=13720&y=6693&z=14&lang=zh_cn
const baseUrls = [
    "https://wprd0{s}.is.autonavi.com/appmaptile?style={style}&x={x}&y={y}&z={z}",
    "https://webrd0{s}.is.autonavi.com/appmaptile?style={style}&x={x}&y={y}&z={z}&size=1&scale=1",
    "https://webst0{s}.is.autonavi.com/appmaptile?style={style}&x={x}&y={y}&z={z}" // same as wprd0
];
const trafficUrl = "https://tm.amap.com/trafficengine/mapabc/traffictile?v=1.0&;t=1&z={z}&y={y}&x={x}&t={time}";


export class PluginGaodeMap extends Plugin {
    public name = "Gaode (高德地图) / AutoNavi map";
    public version = "0.1.0";
    public description = "Map layers from AutoNavi / Gaode (高德地图)";
    public author = "johnd0e";
    public tags: ["map", "tiles", "baselayer"];
    public defaultInactive = true;
    public requires = ["fix-china-map-offset"];


    activate(): void {

        const GaodeLayer = L.TileLayer.extend({
            options: {
                subdomains: "1234",
                minZoom: 3,
                maxZoom: 20,
                maxNativeZoom: 18,
                type: "roads",
                attribution: "© AutoNavi",
                needFixChinaOffset: true // depends on fix-china-map-offset plugin
            },

            initialize: function (options: { [index: string]: string | number }) {
                const expand = (field: string): string => {
                    return options[field] ? `&${field}=${options[field]}` : "";
                }
                const extra = expand("lang") + expand("scl");
                const url = baseUrls[(options.site as number) || 0] + extra;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                (L.TileLayer.prototype as any).initialize.call(this, url, options);
            }
        });


        const AmapTraffic = GaodeLayer.extend({
            getTileUrl: function (coords) {
                this.options.time = Date.now();
                return L.TileLayer.prototype.getTileUrl.call(this, coords);
            },
            initialize: function (options) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                (L.TileLayer.prototype as any).initialize.call(this, trafficUrl, options);
            },
            minZoom: 6,
            maxNativeZoom: 17
        });


        // @ts-ignore - constructer with parameter is not expected
        const roads = new GaodeLayer({ style: 7, maxNativeZoom: 20, lang: "zh_cn" }) as L.TileLayer; // en, zh_en
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const traffic = L.layerGroup([roads, new AmapTraffic({ opacity: 0.75 })]);

        // @ts-ignore
        const satellite = new GaodeLayer({ style: 6, type: "satellite" }) as L.TileLayer;
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const satelliteRoad = L.layerGroup([satellite, new GaodeLayer({ style: 8, type: "roadnet", opacity: 0.75 })]);

        IITC.layers.addBase("Gaode Roads [zh]", roads);
        IITC.layers.addBase("Gaode Roads + Traffic", traffic);
        IITC.layers.addBase("Gaode Satellite", satellite);
        IITC.layers.addBase("Gaode Hybrid", satelliteRoad);
    }

    deactivate(): void {
        IITC.layers.removeBase("Gaode Roads [zh]");
        IITC.layers.removeBase("Gaode Roads + Traffic");
        IITC.layers.removeBase("Gaode Satellite");
        IITC.layers.removeBase("Gaode Hybrid");
    }
}


