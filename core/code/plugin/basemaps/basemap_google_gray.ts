import { IITC } from "../../IITC";
import { Plugin } from "../plugin_base";


export class PluginGrayGoolgleMap extends Plugin {
    public name = "Gray Google map";
    public version = "0.1.3";
    public description = "Add a simplified gray Version of Google map tiles as an optional layer";
    public author = "jacob1123";
    public tags: ["map", "tiles", "baselayer", "google"];
    public defaultInactive = true;


    activate(): void {

        const grayGMapsOptions = {
            maxZoom: 21,
            styles: [
                { featureType: "landscape.natural", stylers: [{ visibility: "simplified" }, { saturation: -100 }, { lightness: -80 }, { gamma: 2.44 }] },
                { featureType: "road", stylers: [{ visibility: "simplified" }, { color: "#bebebe" }, { weight: .6 }] },
                { featureType: "poi", stylers: [{ saturation: -100 }, { visibility: "on" }, { gamma: .34 }] },
                { featureType: "water", stylers: [{ color: "#32324f" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                { featureType: "poi" },
                { featureType: "landscape.man_made", stylers: [{ saturation: -100 }, { gamma: .13 }] },
                { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
        };

        const googleMutant = (L.gridLayer as any).googleMutant as (options: any) => L.GridLayer; // FIXME: GoogleMutant or leaflet-ext. defintion is wrong
        const grayMap = googleMutant(grayGMapsOptions);
        IITC.layers.addBase("Google Gray", grayMap);
    }

    deactivate(): void {
        IITC.layers.removeBase("Google Gray");
    }
}
