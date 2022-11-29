import * as L from "leaflet";
import { IITC } from "../IITC";

export enum TileState {
    "ok",
    "error",
    "cache_fresh",
    "cache_stale",
    "requested",
    "retrying",
    "request_fail",
    "tile_fail",
    "tile_timeout",
    "render_queue",
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
        IITC.layers.addOverlay("DEBUG Data Tiles", this.debugTileLayer, { default: false });

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

    setColour(id: TileID, bordercol, fillcol) {
        const l = this.debugTileToRectangle[id];
        if (l) {
            const s = { color: bordercol, fillColor: fillcol };
            l.setStyle(s);
        }
    }

    setState(id: TileID, state: TileState) {
        let col = "#f0f";
        let fill = "#f0f";
        let clearDelay = -1;
        switch (state) {
            case TileState.ok: {
                col = "#0f0"; fill = "#0f0"; clearDelay = 2; break;
            }
            case TileState.error: {
                col = "#f00"; fill = "#f00"; clearDelay = 30; break;
            }
            case TileState.cache_fresh: {
                col = "#0f0"; fill = "#ff0"; clearDelay = 2; break;
            }
            case TileState.cache_stale: {
                col = "#f00"; fill = "#ff0"; clearDelay = 10; break;
            }
            case TileState.requested: {
                col = "#66f"; fill = "#66f"; break;
            }
            case TileState.retrying: {
                col = "#666"; fill = "#666"; break;
            }
            case TileState.request_fail: {
                col = "#a00"; fill = "#666"; break;
            }
            case TileState.tile_fail: {
                col = "#f00"; fill = "#666"; break;
            }
            case TileState.tile_timeout: {
                col = "#ff0"; fill = "#666"; break;
            }
            case TileState.render_queue: {
                col = "#f0f"; fill = "#f0f"; break;
            }
        }
        this.setColour(id, col, fill);
        if (clearDelay >= 0) {
            const clearAt = Date.now() + clearDelay * 1000;
            this.debugTileClearTimes[id] = clearAt;

            if (!this.timer) {
                this.startTimer(clearDelay * 1000);
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