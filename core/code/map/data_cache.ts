import * as L from "leaflet";
import { SECONDS } from "../helper/times";

interface CacheEntry<T> {
    time: number,
    expire: number,
    size: number,
    dataStr: T
}


/**
 * cache for map data tiles
 */
export class DataCache<T> {
    private REQUEST_CACHE_FRESH_AGE = 3 * 60;  // if younger than this, use data in the cache rather than fetching from the server
    private REQUEST_CACHE_MAX_AGE = 5 * 60;  // maximum cache age. entries are deleted from the cache after this time

    private REQUEST_CACHE_MAX_ITEMS = 1000;  // if more than this many entries, expire early
    private REQUEST_CACHE_MAX_CHARS = 20000000 / 2; // or more than this total size

    private cache: Map<TileID, CacheEntry<T>>;
    private cacheCharSize: number;
    private interval: number | undefined;


    constructor() {

        if (L.Browser.mobile) {
            // on mobile devices, smaller cache size
            this.REQUEST_CACHE_MAX_ITEMS = 300;  // if more than this many entries, expire early
            this.REQUEST_CACHE_MAX_CHARS = 5000000 / 2; // or more than this total size
        }

        this.cacheCharSize = 0;
        this.cache = new Map();
    }


    store(qk: TileID, data: T, freshTime?: number): void {
        this.remove(qk);

        const time = Date.now();

        freshTime = freshTime ?? this.REQUEST_CACHE_FRESH_AGE * 1000;
        const expire = time + freshTime;

        const dataStr = data;
        const size = JSON.stringify(data).length;

        this.cacheCharSize += size;
        this.cache.set(qk, { time, expire, size, dataStr });
    }


    remove(qk: TileID): void {
        const entry = this.cache.get(qk);
        if (entry) {
            this.cacheCharSize -= entry.size;
            this.cache.delete(qk);
        }
    }


    get(qk: TileID): T | undefined {
        const entry = this.cache.get(qk);
        if (entry) {
            return entry.dataStr;
        }

        return undefined;
    }

    getTime(qk: TileID): number {
        const entry = this.cache.get(qk);
        if (entry) {
            return entry.time;
        }

        return 0;
    }

    isFresh(qk: TileID): boolean {
        const entry = this.cache.get(qk);
        if (entry) {
            const now = Date.now();
            return entry.expire >= now;
        }

        return false;
    }

    startExpireInterval(period: number): void {
        if (this.interval === undefined) {
            this.interval = window.setInterval(() => this.runExpire(), period * SECONDS);
        }
    }

    stopExpireInterval(): void {
        if (this.interval !== undefined) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }


    runExpire() {
        const old = Date.now() - this.REQUEST_CACHE_MAX_AGE * 1000;

        let cacheSize = Object.keys(this.cache).length;

        this.cache.forEach((entry, qk) => {
            if (cacheSize > this.REQUEST_CACHE_MAX_ITEMS || this.cacheCharSize > this.REQUEST_CACHE_MAX_CHARS || entry.time < old) {
                this.cacheCharSize -= entry.size;
                this.cache.delete(qk);
                cacheSize--;
            }
        });
    }
}