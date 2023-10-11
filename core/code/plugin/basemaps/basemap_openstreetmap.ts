import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginOSM extends Plugin {
    // OpenStreetMap tiles - we shouldn't use these by default - https://wiki.openstreetmap.org/wiki/Tile_usage_policy
    // "Heavy use (e.g. distributing an app that uses tiles from openstreetmap.org) is forbidden without prior permission from the System Administrators"

    public name = "OpenStreetMap.org map";
    public version = "0.1.1";
    public description = "Add the native OpenStreetMap.org map tiles as an optional layer";
    public author = "jonatkins";
    public tags: ["map", "tiles", "baselayer", "empty"];
    public defaultInactive = true;


    activate(): void {

        const osmOpt = {
            attribution: "Map data © OpenStreetMap contributors",
            maxNativeZoom: 18,
            maxZoom: 21
        };

        const OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
        const OSMHum = "https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
        const OSMCycle = "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";

        IITC.layers.addBase("OpenStreetMap", new L.TileLayer(OSM, osmOpt));
        IITC.layers.addBase("Humanitarian", new L.TileLayer(OSMHum, osmOpt));
        IITC.layers.addBase("CyclOSM", new L.TileLayer(OSMCycle, osmOpt));
    }

    deactivate(): void {
        IITC.layers.removeBase("OpenStreetMap");
        IITC.layers.removeBase("Humanitarian");
    }
}



