import { Options } from "../helper/options";
import { IITCr } from "../IITC";
import * as L from "leaflet";
import { Log, LogApp } from "../helper/log_apps";
const log = Log(LogApp.Map);


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
    "Player Tracker": ["Player Tracker Resistance", "Player Tracker Enlightened"],
    "Drone": ["Drone View", "Drone Route", "Drone Coverage"]
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

        IITCr.menu.addEntry({
            name: menuName,
            id: L.stamp(layer).toString(),
            onClick: () => {
                this.showBase(entry);
                return false;
            },
            isChecked: () => this.isVisible(entry.layer),
            hasCheckbox: true
        });
    }


    removeBase(name: string): L.Layer {
        const entryIndex = this.layers.findIndex(l => l.name === name);
        if (entryIndex < 0) {
            log.warn("layer not found", name);
            return;
        }


        const layer = this.layers[entryIndex].layer;
        IITCr.menu.removeEntry(L.stamp(layer).toString());
        this.layers.splice(entryIndex, 1);

        if (this.isVisible(layer)) {
            layer.remove();
            this.showBaseMap("");
        }
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

        IITCr.menu.addEntry({
            name: menuName,
            id: L.stamp(entry.layer).toString(),
            onClick: () => {
                if (this.isVisible(entry.layer)) {
                    this.hideOverlay(entry);
                } else {
                    this.showOverlay(entry);
                }
                return true;
            },
            isChecked: () => this.isVisible(entry.layer),
            hasCheckbox: true
        });

        if (this.status.getSafe(name, showLayer)) {
            this.showOverlay(entry);
        }
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


    removeOverlay(layer: L.Layer): void {
        const entryIndex = this.layers.findIndex(l => L.stamp(l.layer) === L.stamp(layer));
        if (entryIndex < 0) {
            log.warn("overlay not found");
            return;
        }

        IITCr.menu.removeEntry(L.stamp(layer).toString());
        this.layers.splice(entryIndex, 1);

        if (this.isVisible(layer)) {
            layer.remove();
        }
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
        window.map.fire("baselayerchange", { name: entity.name });
    }

    private showOverlay(entity: LayerEntity): void {
        if (window.map.hasLayer(entity.layer)) return;
        window.map.addLayer(entity.layer);
        this.updateStatus(entity, true);
        window.map.fire("overlayadd", { name: entity.name });
    }

    private hideOverlay(entity: LayerEntity): void {
        if (!window.map.hasLayer(entity.layer)) return;
        window.map.removeLayer(entity.layer);
        this.updateStatus(entity, false);
        window.map.fire("overlayremove", { name: entity.name });
    }

    private updateStatus(entity: LayerEntity, status: boolean): void {
        if (status === !!entity.default) {
            this.status.remove(entity.name);
        } else {
            this.status.set(entity.name, status);
        }
    }

    private isVisible(layer: L.Layer): boolean {
        return window.map.hasLayer(layer);
    }

    areAllDefaultLayerVisible(): boolean {
        return this.layers.every(l => l.isBaseLayer || this.isVisible(l.layer));
    }

    showAllDefaultLayers(): void {
        this.layers.forEach(l => {
            if (l.isBaseLayer || this.isVisible(l.layer)) return;

            this.showOverlay(l);
        })
    }


    isLayerVisible(name: string): boolean {
        const layer = this.layers.find(l => l.name === name);
        if (!layer) return false;
        return this.isVisible(layer.layer);
    }


    isLayerKnown(name: string): boolean {
        return this.layers.some(l => l.name === name);
    }

}
