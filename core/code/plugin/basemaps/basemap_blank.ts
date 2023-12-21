import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";
import blankWhiteImg from "images/map/basemap-blank-tile-white.png";
import blankBlackImg from "images/map/basemap-blank-tile-black.png";


export class PluginBlankMaps extends Plugin {
    public name = "Blank map";
    public version = "0.1.2";
    public description = "Add a blank map layer - no roads or other features";
    public author = "jonatkins";
    public tags: ["map", "tiles", "baselayer", "empty"];
    public defaultInactive = true;


    activate(): void {

        const blankOpt = { attribution: "", maxNativeZoom: 18, maxZoom: 21 };
        const blankWhite = new L.TileLayer(blankWhiteImg, blankOpt);
        const blankBlack = new L.TileLayer(blankBlackImg, blankOpt);

        IITC.layers.addBase("Blank Map (White)", blankWhite);
        IITC.layers.addBase("Blank Map (Black)", blankBlack);
    }

    deactivate(): void {
        IITC.layers.removeBase("Blank Map (White)");
        IITC.layers.removeBase("Blank Map (Black)");
    }
}
