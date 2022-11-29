import { Options } from "../helper/options";
import { IITC } from "../IITC";
import * as L from "leaflet";


export interface LayerOptions {
    default: boolean;
}


interface LayerEntity {
    layer: L.Layer;
    name: string;
    isBaseLayer: boolean;
    default?: boolean;
}

const groupOldLayers = {
    "Ornaments": ["Artifacts", "Beacons", "Frackers",
        "Ornament: Anomaly Portals", "Ornament: Battle Beacons",
        "Ornament: Battle Results", "Ornament: Scout Controller"],
    "Player Tracker": ["Player Tracker Resistance", "Player Tracker Enlightened"]
};



export class LayerManager {

    private status: Options<string>;
    private layers: LayerEntity[];

    constructor() {
        this.status = new Options("ingress.intelmap.layergroupdisplayed");
        this.layers = [];
    }


    addBase(name: string, layer: L.Layer): void {
        console.assert(this.layers.every(l => l.name !== name), "layer name already used");

        const entry: LayerEntity = {
            layer,
            name,
            isBaseLayer: true
        }
        this.layers.push(entry);

        const menuName = "layer\\Base Layer\\" + name;

        IITC.menu.addEntry({
            name: menuName,
            onClick: () => {
                this.showBase(entry);
                return false;
            },
            isChecked: () => this.isVisible(entry),
            hasCheckbox: true
        });
    }

    addOverlay(name: string, layer: L.Layer, options: Partial<LayerOptions> = {}): void {
        console.assert(this.layers.every(l => l.name !== name), "layer name already used");

        name = this.renameOldLayer(name);
        const showLayer = (options.default === undefined ? true : options.default);

        const entry: LayerEntity = {
            layer,
            name,
            isBaseLayer: false,
            default: showLayer
        }
        this.layers.push(entry);

        const menuName = "layer\\" + name;

        IITC.menu.addEntry({
            name: menuName,
            onClick: () => {
                if (this.isVisible(entry)) {
                    this.hideOverlay(entry);
                } else {
                    this.showOverlay(entry);
                }
                return false;
            },
            isChecked: () => this.isVisible(entry),
            hasCheckbox: true
        });
    }

    private renameOldLayer(name: string): string {
        // eslint-disable-next-line guard-for-in
        for (const group in groupOldLayers) {
            const names = groupOldLayers[group] as string[];
            if (names.includes(name)) {
                return group + "\\" + name;
            }
        }

        return name;
    }


    showBaseMap(name: string): void {
        let layer = this.layers.find(l => l.name === name);
        if (!layer) layer = this.layers.find(l => l.name === "Google Roads");
        if (!layer) layer = this.layers.find(l => l.isBaseLayer);
        if (!layer) throw new Error("no base map layer available");

        this.showBase(layer);
    }


    private showBase(entity: LayerEntity): void {
        this.layers
            .filter(l => l.isBaseLayer)
            .forEach(l => window.map.removeLayer(l.layer));

        window.map.addLayer(entity.layer);
    }

    private showOverlay(entity: LayerEntity): void {
        if (window.map.hasLayer(entity.layer)) return;
        window.map.addLayer(entity.layer);
        this.updateStatus(entity, true);
    }

    private hideOverlay(entity: LayerEntity): void {
        if (!window.map.hasLayer(entity.layer)) return;
        window.map.removeLayer(entity.layer);
        this.updateStatus(entity, false);
    }

    private updateStatus(entity: LayerEntity, status: boolean): void {
        if (status === !!entity.default) {
            this.status.remove(entity.name);
        } else {
            this.status.set(entity.name, status);
        }
    }

    private isVisible(entity: LayerEntity): boolean {
        return window.map.hasLayer(entity.layer);
    }

    areAllDefaultLayerVisible(): boolean {
        return this.layers.every(l => l.isBaseLayer || this.isVisible(l));
    }

    showAllDefaultLayers(): void {
        this.layers.forEach(l => {
            if (l.isBaseLayer || this.isVisible(l)) return;

            this.showOverlay(l);
        })
    }

}
