import * as L from "leaflet";
import { IITCr } from "../IITC";

export const enum TileState {
    "ok",
    "error",
    "cache_fresh",
    "cache_stale",
    "cache_old",
    "requested",
    "retrying",
    "request_fail",
    "tile_fail",
    "tile_timeout",
    "render_queue",
}

const StateColors: { [index in TileState]: { color: string, fill: string, clearDelay?: number } } = {
    [TileState.ok]: { color: "#0f0", fill: "#0f0", clearDelay: 2 },
    [TileState.error]: { color: "#f00", fill: "#f00", clearDelay: 30 },
    [TileState.cache_fresh]: { color: "#0f0", fill: "#ff0", clearDelay: 2 },
    [TileState.cache_stale]: { color: "#f00", fill: "#ff0", clearDelay: 10 },
    [TileState.cache_old]: { color: "#f6f", fill: "#ff0", clearDelay: 10 },
    [TileState.requested]: { color: "#66f", fill: "#66f" },
    [TileState.retrying]: { color: "#666", fill: "#666" },
    [TileState.request_fail]: { color: "#a00", fill: "#666" },
    [TileState.tile_fail]: { color: "#f00", fill: "#666" },
    [TileState.tile_timeout]: { color: "#ff0", fill: "#666" },
    [TileState.render_queue]: { color: "#f0f", fill: "#f0f" }
}



/**
 * useful bits to assist debugging map data tiles
 */
export class RenderDebugTiles {

    private CLEAR_CHECK_TIME = 0.1;
    private FADE_TIME = 1.0;
    private debugTileLayer: L.LayerGroup<any>;
    private debugTileToRectangle: { [id: TileID]: L.Rectangle } = {};
    private debugTileClearTimes: { [id: TileID]: number } = {};
    private timer: number | undefined;

    constructor() {
        this.debugTileLayer = L.layerGroup();
        IITCr.layers.addOverlay("DEBUG Data Tiles", this.debugTileLayer, { default: false });

        this.debugTileToRectangle = {};
        this.debugTileClearTimes = {};
        this.timer = undefined;
    }


    reset(): void {
        this.debugTileLayer.clearLayers();
        this.debugTileToRectangle = {};
        this.debugTileClearTimes = {};
    }


    create(id: TileID, inbounds: L.LatLngBoundsLiteral): void {
        const s = { color: "#666", weight: 1, opacity: 0.4, fillColor: "#666", fillOpacity: 0.1, interactive: false };

        let bounds = new L.LatLngBounds(inbounds);
        bounds = bounds.pad(-0.02);

        const l = L.rectangle(bounds, s);
        this.debugTileToRectangle[id] = l;
        this.debugTileLayer.addLayer(l);
        if (window.map.hasLayer(this.debugTileLayer)) {
            // only bring to back if we have the debug layer turned on
            l.bringToBack();
        }
    }

    setColour(id: TileID, bordercol: string, fillcol: string) {
        const l = this.debugTileToRectangle[id];
        if (l) {
            const s = { color: bordercol, fillColor: fillcol };
            l.setStyle(s);
        }
    }

    setState(id: TileID, state: TileState) {
        const colors = StateColors[state];

        this.setColour(id, colors.color, colors.fill);

        if (colors.clearDelay && colors.clearDelay >= 0) {
            const clearAt = Date.now() + colors.clearDelay * 1000;
            this.debugTileClearTimes[id] = clearAt;

            if (!this.timer) {
                this.startTimer(colors.clearDelay * 1000);
            }
        }
    }


    startTimer(waitTime: number): void {
        if (!this.timer) {
            // a timeout of 0 firing the actual timeout - helps things run smoother
            this.timer = window.setTimeout(() => {
                this.timer = window.setTimeout(() => { this.timer = undefined; this.runClearPass(); }, waitTime);
            }, 0);
        }
    }

    runClearPass() {

        const now = Date.now();
        // eslint-disable-next-line guard-for-in
        for (const id in this.debugTileClearTimes) {
            const diff = now - this.debugTileClearTimes[id];
            if (diff > 0) {
                if (diff > this.FADE_TIME * 1000) {
                    this.debugTileLayer.removeLayer(this.debugTileToRectangle[id]);
                    delete this.debugTileClearTimes[id];
                } else {
                    const fade = 1.0 - (diff / (this.FADE_TIME * 1000));

                    this.debugTileToRectangle[id].setStyle({ opacity: 0.4 * fade, fillOpacity: 0.1 * fade });
                }
            }
        }

        if (Object.keys(this.debugTileClearTimes).length > 0) {
            this.startTimer(this.CLEAR_CHECK_TIME * 1000);
        }
    }
}