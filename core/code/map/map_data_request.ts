import * as L from "leaflet";
import { SECONDS } from "../helper/times";
import { Render } from "./map_data_render";
import { DataCache } from "./data_cache";
import { RenderDebugTiles, TileState } from "./map_data_debug";
import { clampLatLngBounds } from "../utils_misc";
import { getDataZoomForMapZoom, getMapZoomTileParameters, latToTile, lngToTile, pointToTileId, tileToLat, tileToLng } from "./map_data_calc_tools";
import { Log, LogApp } from "../helper/log_apps";
import { idle } from "./idle";
import { mapStatus } from "../ui/status";
import { addHook, runHooks } from "../helper/hooks";
const log = Log(LogApp.Map);



// no more than this many requests in parallel. stock site seems to rely on browser limits (6, usually), sending
// many requests at once.
// using our own queue limit ensures that other requests (e.g. chat, portal details) don't get delayed
const MAX_REQUESTS = 5;

// this many tiles in one request
const NUM_TILES_PER_REQUEST = 25;

// number of times to retry a tile after an error (including "error: TIMEOUT" now - as stock intel does)
// TODO? different retry counters for TIMEOUT vs other errors..?
const MAX_TILE_RETRIES = 5;

// refresh timers
const MOVE_REFRESH = 3; // time, after a map move (pan/zoom) before starting the refresh processing
const STARTUP_REFRESH = 3; // refresh time used on first load of IITC
const IDLE_RESUME_REFRESH = 5; // refresh time used after resuming from idle

// after one of the above, there's an additional delay between preparing the refresh (clearing out of bounds,
// processing cache, etc) and actually sending the first network requests
const DOWNLOAD_DELAY = 1;  // delay after preparing the data download before tile requests are sent


// a short delay between one request finishing and the queue being run for the next request.
const RUN_QUEUE_DELAY = 0;

// delay before processing the queue after failed requests
const BAD_REQUEST_RUN_QUEUE_DELAY = 5; // longer delay before doing anything after errors (other than TIMEOUT)

// delay before processing the queue after empty responses
const EMPTY_RESPONSE_RUN_QUEUE_DELAY = 5; // also long delay - empty responses are likely due to some server issues

// delay before processing the queue after error==TIMEOUT requests. this is 'expected', so minimal extra delay over the regular RUN_QUEUE_DELAY
const TIMEOUT_REQUEST_RUN_QUEUE_DELAY = 0;


// delay before repeating the render loop. this gives a better chance for user interaction
const RENDER_PAUSE = window.isApp ? 0.2 : 0.1; // 200ms mobile, 100ms desktop


const REFRESH_CLOSE = 300;  // refresh time to use for close views z>12 when not idle and not moving
const REFRESH_FAR = 900;  // refresh time for far views z <= 12
const FETCH_TO_REFRESH_FACTOR = 2;  // minimum refresh time is based on the time to complete a data fetch, times this value

interface RequestStatus {
    short: string,
    long?: string,
    progress?: number
}


interface RenderQueueEntry {
    id: TileID,
    deleted: string[],
    entities: any[],
    status: TileState
}

interface TileRequestResult {
    result: {
        map: {
            [id: TileID]: TileData
        }
    },
    error: string
}

export interface TileData {
    deletedGameEntityGuids?: string[],
    gameEntities?: [],
    error?: string
}


/**
 * class to request the map data tiles from the Ingress servers
 * and then pass it on to the render class for display purposes
 * Uses the map data cache class to reduce network requests
 */
export class MapDataRequest {

    private cache: DataCache<TileData>;
    private render: Render;
    private debugTiles: RenderDebugTiles;

    private activeRequestCount = 0;
    private requestedTiles = {};

    private renderQueue: RenderQueueEntry[];
    private renderQueueTimer: number | undefined;
    private renderQueuePaused = false;
    private fetchedDataParams: {
        mapZoom: number,
        dataZoom: number,
        bounds: L.LatLngBounds
    };
    private refreshStartTime;
    private timerExpectedTimeoutTime: number;
    private timer: number | undefined;
    private tileErrorCount: { [index: TileID]: number };
    private requestedTileCount: number;
    private successTileCount: number;
    private failedTileCount: number;
    private staleTileCount: number;
    private RENDER_BATCH_SIZE: number;

    /**
     * the 'set' of requested tile QKs
     */
    private queuedTiles: { [index: TileID]: TileID };


    private idle = false;


    constructor() {
        this.cache = new DataCache();
        this.render = new Render();
        this.debugTiles = new RenderDebugTiles();

        this.activeRequestCount = 0;
        this.requestedTiles = {};

        this.renderQueue = [];
        this.renderQueueTimer = undefined;
        this.renderQueuePaused = false;

        // render queue
        // number of items to process in each render pass. there are pros and cons to smaller and larger values
        // (however, if using leaflet canvas rendering, it makes sense to push as much as possible through every time)
        this.RENDER_BATCH_SIZE = window.map.options.preferCanvas ? 1e9 : 1500;

        this.idle = false;

        // add a portalDetailLoaded hook, so we can use the extended details to update portals on the map
        addHook("portalDetailLoaded", data => {
            if (data.success) {
                this.render.createPortalEntity(data.ent, "detailed");
            }
        });
    }


    start() {

        // setup idle resume function
        idle.addResumeFunction(() => this.idleResume());

        // and map move start/end callbacks
        window.map.on("movestart", () => this.mapMoveStart());
        window.map.on("moveend", () => this.mapMoveEnd());


        // then set a timeout to start the first refresh
        this.refreshOnTimeout(STARTUP_REFRESH);
        this.updateStatus();

        this.cache.startExpireInterval(15);
    }


    mapMoveStart() {
        log.log("refresh map movestart");

        this.clearStatus();
        this.clearTimeout();
        this.pauseRenderQueue(true);
    }


    mapMoveEnd() {
        const bounds = clampLatLngBounds(window.map.getBounds());

        if (this.fetchedDataParams) {
            // we have fetched (or are fetching) data...
            if (this.fetchedDataParams.mapZoom === window.map.getZoom() && this.fetchedDataParams.bounds.contains(bounds)) {
                // ... and the zoom level is the same and the current bounds is inside the fetched bounds
                // so, no need to fetch data. if there's time left, restore the original timeout

                const remainingTime = (this.timerExpectedTimeoutTime - Date.now()) / 1000;

                if (remainingTime > MOVE_REFRESH) {
                    this.clearStatus();
                    this.refreshOnTimeout(remainingTime);
                    this.pauseRenderQueue(false);
                    return;
                }
            }
        }

        this.updateStatus();
        this.refreshOnTimeout(MOVE_REFRESH);
    }


    idleResume() {
        // if we have no timer set and there are no active requests, refresh has gone idle and the timer needs restarting
        if (this.idle) {
            log.log("refresh map idle resume");
            this.idle = false;
            this.updateStatus();
            this.refreshOnTimeout(IDLE_RESUME_REFRESH);
        }
    }


    clearTimeout() {

        if (this.timer) {
            log.log("cancelling existing map refresh timer");
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    refreshOnTimeout(seconds: number) {
        this.clearTimeout();

        log.log(`starting map refresh in ${seconds} seconds`);

        // 'this' won't be right inside the callback, so save it
        // also, double setTimeout used to ensure the delay occurs after any browser-related rendering/updating/etc
        this.timer = window.setTimeout(() => {
            this.timer = window.setTimeout(() => { this.timer = undefined; this.refresh(); }, seconds * SECONDS);
        }, 0);
        this.timerExpectedTimeoutTime = Date.now() + seconds * 1000;
    }


    updateStatus(): void {
        const allTiles = this.requestedTileCount;
        const loaded = this.failedTileCount + this.successTileCount + this.staleTileCount;
        // const failed = this.failedRequestCount;

        mapStatus.update({
            total: allTiles,
            done: loaded,
            failed: this.failedTileCount
        });
    }

    clearStatus(): void {
        mapStatus.update();
    }



    refresh() {

        // if we're idle, don't refresh
        if (idle.isIdle()) {
            log.log("suspending map refresh - is idle");
            this.clearStatus();
            this.idle = true;
            return;
        }

        // time the refresh cycle
        this.refreshStartTime = Date.now();

        this.debugTiles.reset();
        this.resetRenderQueue();

        // a 'set' to keep track of hard failures for tiles
        this.tileErrorCount = {};

        // the 'set' of requested tile QKs
        // NOTE: javascript does not guarantee any order to properties of an object. however, in all major implementations
        // properties retain the order they are added in. IITC uses this to control the tile fetch order. if browsers change
        // then fetch order isn't optimal, but it won't break things.
        this.queuedTiles = {};


        const bounds = clampLatLngBounds(window.map.getBounds());
        const mapZoom = window.map.getZoom();

        const dataZoom = getDataZoomForMapZoom(mapZoom);

        const tiles = getMapZoomTileParameters(dataZoom);

        const x1 = lngToTile(bounds.getWest(), tiles);
        const x2 = lngToTile(bounds.getEast(), tiles);
        const y1 = latToTile(bounds.getNorth(), tiles);
        const y2 = latToTile(bounds.getSouth(), tiles);

        // calculate the full bounds for the data - including the part of the tiles off the screen edge
        const dataBounds = L.latLngBounds([
            [tileToLat(y2 + 1, tiles), tileToLng(x1, tiles)],
            [tileToLat(y1, tiles), tileToLng(x2 + 1, tiles)]
        ]);

        // store the parameters used for fetching the data. used to prevent unneeded refreshes after move/zoom
        this.fetchedDataParams = { bounds: dataBounds, mapZoom, dataZoom };


        runHooks("mapDataRefreshStart", { bounds, mapZoom, dataZoom, minPortalLevel: tiles.level, tileBounds: dataBounds });

        this.render.startRenderPass(dataBounds);

        runHooks("mapDataEntityInject", { callback: this.render.processGameEntities.bind(this.render) });

        // TODO special artifacts handling
        // this.render.processGameEntities(artifact.getArtifactEntities(), "summary");

        let logMessage = `requesting data tiles at zoom ${dataZoom}`;
        logMessage += " (L" + tiles.level + "+ portals";
        logMessage += ", " + tiles.tilesPerEdge + " tiles per global edge), map zoom is " + mapZoom;

        log.log(logMessage);


        this.requestedTileCount = 0;
        this.successTileCount = 0;
        this.failedTileCount = 0;
        this.staleTileCount = 0;

        const tilesToFetchDistance = {};

        // map center point - for fetching center tiles first
        const mapCenterPoint = window.map.project(window.map.getCenter(), mapZoom);

        // y goes from left to right
        for (let y = y1; y <= y2; y++) {
            // x goes from bottom to top(?)
            for (let x = x1; x <= x2; x++) {
                const tile_id = pointToTileId(tiles, x, y);
                const latNorth = tileToLat(y, tiles);
                const latSouth = tileToLat(y + 1, tiles);
                const lngWest = tileToLng(x, tiles);
                const lngEast = tileToLng(x + 1, tiles);

                this.debugTiles.create(tile_id, [[latSouth, lngWest], [latNorth, lngEast]]);

                if (this.cache.isFresh(tile_id)) {
                    // data is fresh in the cache - just render it
                    this.pushRenderQueue(tile_id, this.cache.get(tile_id), TileState.cache_fresh);
                } else {

                    // no fresh data

                    // tile needed. calculate the distance from the centre of the screen, to optimise the load order

                    const latCenter = (latNorth + latSouth) / 2;
                    const lngCenter = (lngEast + lngWest) / 2;
                    const tileLatLng = L.latLng(latCenter, lngCenter);

                    const tilePoint = window.map.project(tileLatLng, mapZoom);

                    const delta = mapCenterPoint.subtract(tilePoint);
                    const distanceSquared = delta.x * delta.x + delta.y * delta.y;

                    tilesToFetchDistance[tile_id] = distanceSquared;
                    this.requestedTileCount += 1;
                }
            }
        }

        // re-order the tile list by distance from the centre of the screen. this should load more relevant data first
        const tilesToFetch = Object.keys(tilesToFetchDistance);
        tilesToFetch.sort((a, b) => {
            return tilesToFetchDistance[a] - tilesToFetchDistance[b];
        });

        tilesToFetch.forEach(qk => this.queuedTiles[qk] = qk);

        this.updateStatus();

        // technically a request hasn't actually finished - however, displayed portal data has been refreshed
        // so as far as plugins are concerned, it should be treated as a finished request
        runHooks("requestFinished", { success: true });

        log.log("done request preparation (cleared out-of-bounds and invalid for zoom, and rendered cached data)");

        if (Object.keys(this.queuedTiles).length > 0) {
            // queued requests - don't start processing the download queue immediately - start it after a short delay
            this.delayProcessRequestQueue(DOWNLOAD_DELAY);
        } else {
            // all data was from the cache, nothing queued - run the queue 'immediately' so it handles the end request processing
            this.delayProcessRequestQueue(0);
        }
    }


    delayProcessRequestQueue(seconds) {
        if (this.timer === undefined) {
            this.timer = window.setTimeout(() => {
                this.timer = window.setTimeout(() => { this.timer = undefined; this.processRequestQueue(); }, seconds * 1000);
            }, 0);
        }
    }


    processRequestQueue(): void {

        if (Object.keys(this.queuedTiles).length === 0) {
            // we leave the renderQueue code to handle ending the render pass now
            // (but we need to make sure it's not left without it's timer running!)
            if (!this.renderQueuePaused) {
                this.startQueueTimer(RENDER_PAUSE);
            }

            return;
        }


        // create a list of tiles that aren't requested over the network
        const pendingTiles: TileID[] = [];
        for (const id in this.queuedTiles) {
            if (!(id in this.requestedTiles)) {
                pendingTiles.push(id);
            }
        }

        //  log.log('- request state: '+Object.keys(this.requestedTiles).length+' tiles in '+this.activeRequestCount+' active requests, '+pendingTiles.length+' tiles queued');

        const requestBuckets = MAX_REQUESTS - this.activeRequestCount;
        if (pendingTiles.length > 0 && requestBuckets > 0) {

            const requestBucketSize = Math.min(NUM_TILES_PER_REQUEST, Math.max(5, Math.ceil(pendingTiles.length / requestBuckets)));
            for (let bucket = 0; bucket < requestBuckets; bucket++) {

                // if the tiles for this request have had several retries, use smaller requests
                // maybe some of the tiles caused all the others to error? no harm anyway, and it may help...
                let numTilesThisRequest = Math.min(requestBucketSize, pendingTiles.length);

                let id = pendingTiles[0];
                let retryTotal = (this.tileErrorCount[id] || 0);
                for (let i = 1; i < numTilesThisRequest; i++) {
                    id = pendingTiles[i];
                    retryTotal += (this.tileErrorCount[id] || 0);
                    if (retryTotal > MAX_TILE_RETRIES) {
                        numTilesThisRequest = i;
                        break;
                    }
                }

                const tiles = pendingTiles.splice(0, numTilesThisRequest);
                if (tiles.length > 0) {
                    this.sendTileRequest(tiles);
                }
            }
        }


        this.updateStatus();
    }


    sendTileRequest(tiles: TileID[]) {

        const tilesList: TileID[] = [];

        tiles.forEach(id => {
            this.debugTiles.setState(id, TileState.requested);

            this.requestedTiles[id] = true;

            if (id in this.queuedTiles) {
                tilesList.push(id);
            } else {
                log.warn("no queue entry for tile id " + id);
            }
        });

        const data = { tileKeys: tilesList };

        this.activeRequestCount += 1;

        // NOTE: don't add the request with window.request.add, as we don't want the abort handling to apply to map data any more
        window.postAjax("getEntities", data,
            result => this.handleResponse(result as TileRequestResult, tiles),
            () => this.handleResponseError(tiles)
        );
    }

    requeueTile(id: TileID, error: boolean) {
        if (id in this.queuedTiles) {
            // tile is currently wanted...

            // first, see if the error can be ignored due to retry counts
            if (error) {
                this.tileErrorCount[id] = (this.tileErrorCount[id] || 0) + 1;
                if (this.tileErrorCount[id] <= MAX_TILE_RETRIES) {
                    // retry limit low enough - clear the error flag
                    error = false;
                }
            }

            if (error) {
                // if error is still true, retry limit hit. use stale data from cache if available
                const data = this.cache.get(id);
                if (data) {
                    // we have cached data - use it, even though it's stale
                    this.pushRenderQueue(id, data, TileState.cache_stale);
                    this.staleTileCount += 1;
                } else {
                    // no cached data
                    this.debugTiles.setState(id, TileState.error);
                    this.failedTileCount += 1;
                }
                // and delete from the pending requests...
                delete this.queuedTiles[id];

            } else {
                // if false, was a 'timeout' or we're retrying, so unlimited retries (as the stock site does)
                this.debugTiles.setState(id, TileState.retrying);

                // FIXME? it's nice to move retried tiles to the end of the request queue. however, we don't actually have a
                // proper queue, just an object with guid as properties. Javascript standards don't guarantee the order of properties
                // within an object. however, all current browsers do keep property order, and new properties are added at the end.
                // therefore, delete and re-add the requeued tile and it will be added to the end of the queue
                delete this.queuedTiles[id];
                this.queuedTiles[id] = id;

            }
        } // else the tile wasn't currently wanted (an old non-cancelled request) - ignore
    }


    handleResponse(data: TileRequestResult | undefined, tiles: TileID[]) {

        this.activeRequestCount -= 1;

        const successTiles: TileID[] = [];
        const errorTiles: TileID[] = [];
        const retryTiles: TileID[] = [];
        const timeoutTiles: TileID[] = [];
        let unaccountedTiles = tiles.slice(0);

        if (!data || !data.result) {
            log.warn("Request.handleResponse: request failed - requeuing..." + (data && data.error ? " error: " + data.error : ""));

            // request failed - requeue all the tiles(?)
            if (data && data.error && data.error === "RETRY") {
                // the server can sometimes ask us to retry a request. this is botguard related, I believe
                tiles.forEach(id => {
                    retryTiles.push(id);
                    this.debugTiles.setState(id, TileState.retrying);
                });

                runHooks("requestFinished", { success: false });

            } else {
                tiles.forEach(id => {
                    errorTiles.push(id);
                    this.debugTiles.setState(id, TileState.request_fail);
                });

                runHooks("requestFinished", { success: false });
            }
            unaccountedTiles = [];
        } else {

            const m = data.result.map;

            // eslint-disable-next-line guard-for-in
            for (const id in m) {
                const value = m[id];
                unaccountedTiles.splice(unaccountedTiles.indexOf(id), 1);
                if ("error" in value) {
                    // server returned an error for this individual data tile

                    if (value.error === "TIMEOUT") {
                        // TIMEOUT errors for individual tiles are quite common. used to be unlimited retries, but not any more
                        timeoutTiles.push(id);
                    } else {
                        log.warn(`map data tile ${id} failed: error==${value.error}`);
                        errorTiles.push(id);
                        this.debugTiles.setState(id, TileState.tile_fail);
                    }
                } else {
                    // no error for this data tile - process it
                    successTiles.push(id);

                    // store the result in the cache
                    this.cache.store(id, value);

                    // if this tile was in the render list, render it
                    // (requests aren't aborted when new requests are started, so it's entirely possible we don't want to render it!)
                    if (id in this.queuedTiles) {

                        this.pushRenderQueue(id, value, TileState.ok);

                        delete this.queuedTiles[id];
                        this.successTileCount += 1;

                    } // else we don't want this tile (from an old non-cancelled request) - ignore
                }
            }

            runHooks("requestFinished", { success: true });
        }

        // set the queue delay based on any errors or timeouts
        // NOTE: retryTimes are retried at the regular delay - no longer wait as for error/timeout cases
        const nextQueueDelay = errorTiles.length > 0 ? BAD_REQUEST_RUN_QUEUE_DELAY :
            unaccountedTiles.length > 0 ? EMPTY_RESPONSE_RUN_QUEUE_DELAY :
                timeoutTiles.length > 0 ? TIMEOUT_REQUEST_RUN_QUEUE_DELAY :
                    RUN_QUEUE_DELAY;

        let statusMessage = `getEntities status: ${tiles.length} tiles: `;
        statusMessage += successTiles.length + " successful";
        if (retryTiles.length > 0) statusMessage += ", " + retryTiles.length + " retried";
        if (timeoutTiles.length > 0) statusMessage += ", " + timeoutTiles.length + " timed out";
        if (errorTiles.length > 0) statusMessage += ", " + errorTiles.length + " failed";
        if (unaccountedTiles.length > 0) statusMessage += ", " + unaccountedTiles.length + " unaccounted";
        statusMessage += ". delay " + nextQueueDelay + " seconds";
        log.log(statusMessage);


        // requeue any 'timeout' tiles immediately
        timeoutTiles.forEach(id => {
            delete this.requestedTiles[id];
            this.requeueTile(id, true);
        });

        retryTiles.forEach(id => {
            delete this.requestedTiles[id];
            this.requeueTile(id, false);  // tiles from a error==RETRY request are requeued without counting it as an error
        });

        errorTiles.forEach(id => {
            delete this.requestedTiles[id];
            this.requeueTile(id, true);
        });

        unaccountedTiles.forEach(id => {
            delete this.requestedTiles[id];
            this.requeueTile(id, true);
        });

        successTiles.forEach(id => {
            delete this.requestedTiles[id];
        });

        this.delayProcessRequestQueue(nextQueueDelay);
    }


    handleResponseError(errorTiles: TileID[]) {

        this.activeRequestCount -= 1;

        log.warn("Request.handleResponse: request failed - requeuing...");

        errorTiles.forEach(id => {
            this.debugTiles.setState(id, TileState.request_fail);
        });

        runHooks("requestFinished", { success: false });

        errorTiles.forEach(id => {
            delete this.requestedTiles[id];
            this.requeueTile(id, true);
        });


        let statusMessage = `getEntities status: ${errorTiles.length} tiles: Request Error`;
        statusMessage += `. delay ${BAD_REQUEST_RUN_QUEUE_DELAY} seconds`;
        log.log(statusMessage);

        this.delayProcessRequestQueue(BAD_REQUEST_RUN_QUEUE_DELAY);
    }


    resetRenderQueue(): void {
        this.renderQueue = [];

        if (this.renderQueueTimer) {
            clearTimeout(this.renderQueueTimer);
            this.renderQueueTimer = undefined;
        }
        this.renderQueuePaused = false;
    }


    pushRenderQueue(id: TileID, data: TileData, status: TileState) {
        this.debugTiles.setState(id, TileState.render_queue);
        this.renderQueue.push({
            id,
            // the data in the render queue is modified as we go, so we need to copy the values of the arrays.
            // just storing the reference would modify the data in the cache!
            deleted: (data.deletedGameEntityGuids || []).slice(0),
            entities: (data.gameEntities || []).slice(0),
            status
        });

        if (!this.renderQueuePaused) {
            this.startQueueTimer(RENDER_PAUSE);
        }
    }

    startQueueTimer(delay: number) {
        if (this.renderQueueTimer === undefined) {
            this.renderQueueTimer = window.setTimeout(() => {
                this.renderQueueTimer = window.setTimeout(() => { this.renderQueueTimer = undefined; this.processRenderQueue(); }, (delay || 0) * 1000);
            }, 0);
        }
    }

    pauseRenderQueue(pause) {
        this.renderQueuePaused = pause;
        if (pause) {
            if (this.renderQueueTimer) {
                clearTimeout(this.renderQueueTimer);
                this.renderQueueTimer = undefined;
            }
        } else {
            if (this.renderQueue.length > 0) {
                this.startQueueTimer(RENDER_PAUSE);
            }
        }
    }

    processRenderQueue() {
        let drawEntityLimit = this.RENDER_BATCH_SIZE;


        // TODO: we don't take account of how many of the entities are actually new/removed - they
        // could already be drawn and not changed. will see how it works like this...
        while (drawEntityLimit > 0 && this.renderQueue.length > 0) {
            const current = this.renderQueue[0];

            if (current.deleted.length > 0) {
                const deleteThisPass = current.deleted.splice(0, drawEntityLimit);
                drawEntityLimit -= deleteThisPass.length;
                this.render.processDeletedGameEntityGuids(deleteThisPass);
            }

            if (drawEntityLimit > 0 && current.entities.length > 0) {
                const drawThisPass = current.entities.splice(0, drawEntityLimit);
                drawEntityLimit -= drawThisPass.length;
                this.render.processGameEntities(drawThisPass, "extended");
            }

            if (current.deleted.length === 0 && current.entities.length === 0) {
                this.renderQueue.splice(0, 1);
                this.debugTiles.setState(current.id, current.status);
            }
        }

        if (this.renderQueue.length > 0) {
            this.startQueueTimer(RENDER_PAUSE);
        } else if (Object.keys(this.queuedTiles).length === 0) {

            this.render.endRenderPass();

            const endTime = Date.now();
            const duration = (endTime - this.refreshStartTime) / 1000;

            log.log(`finished requesting data! (took ${duration} seconds to complete)`);

            runHooks("mapDataRefreshEnd", {});


            // refresh timer based on time to run this pass, with a minimum of REFRESH seconds
            const minRefresh = window.map.getZoom() > 12 ? REFRESH_CLOSE : REFRESH_FAR;
            const refreshTimer = Math.max(minRefresh, duration * FETCH_TO_REFRESH_FACTOR);
            this.refreshOnTimeout(refreshTimer);

            this.updateStatus();
        }
    }
}
