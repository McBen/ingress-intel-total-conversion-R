import * as L from "leaflet";
import { MINUTES, SECONDS } from "../helper/times";

interface CacheEntry<T> {
    time: number,
    expire: number,
    size: number,
    dataStr: T
}


/**
 * cache for map data tiles
 */
export class DataCache<ID, T> {
    private REQUEST_CACHE_FRESH_AGE = 3 * MINUTES;  // if younger than this, use data in the cache rather than fetching from the server
    private REQUEST_CACHE_MAX_AGE = 5 * MINUTES;  // maximum cache age. entries are deleted from the cache after this time

    private REQUEST_CACHE_MAX_ITEMS = 1000;  // if more than this many entries, expire early
    private REQUEST_CACHE_MAX_CHARS = 20000000 / 2; // or more than this total size

    private cache: Map<ID, CacheEntry<T>>;
    private cacheCharSize: number;
    private interval: number | undefined;
    private cacheHit: number;
    private cacheMiss: number;
    private cacheNotFound: number;
    private itemSizeMin: number;
    private itemSizeMax: number;


    constructor() {

        if (L.Browser.mobile) {
            // on mobile devices, smaller cache size
            this.REQUEST_CACHE_MAX_ITEMS = 300;  // if more than this many entries, expire early
            this.REQUEST_CACHE_MAX_CHARS = 5000000 / 2; // or more than this total size
        }

        this.cacheCharSize = 0;
        this.cache = new Map();
        this.cacheHit = 0;
        this.cacheMiss = 0;
        this.cacheNotFound = 0;
        this.itemSizeMin = Infinity;
        this.itemSizeMax = 1;
    }


    store(qk: ID, data: T): void {
        this.remove(qk);

        const time = Date.now();
        const expire = time + this.REQUEST_CACHE_FRESH_AGE;

        const dataStr = data;
        const size = JSON.stringify(data).length; // guess memory size

        if (this.itemSizeMin > size) this.itemSizeMin = size;
        if (this.itemSizeMax < size) this.itemSizeMax = size;

        this.cacheCharSize += size;
        this.cache.set(qk, { time, expire, size, dataStr });
    }


    remove(qk: ID): void {
        const entry = this.cache.get(qk);
        if (entry) {
            this.cacheCharSize -= entry.size;
            this.cache.delete(qk);
        }
    }


    get(qk: ID): T | undefined {
        const entry = this.cache.get(qk);
        if (entry) {
            return entry.dataStr;
        }

        return undefined;
    }

    getTime(qk: ID): number {
        const entry = this.cache.get(qk);
        if (entry) {
            return entry.time;
        }

        return 0;
    }

    isFresh(qk: ID): boolean {
        const entry = this.cache.get(qk);
        if (entry) {
            const now = Date.now();
            if (entry.expire >= now) {
                this.cacheHit++;
                return true;
            }
            this.cacheMiss++;
        } else {
            this.cacheNotFound++;
        }

        return false;
    }

    startExpireInterval(period_in_seconds: number): void {
        if (this.interval === undefined) {
            this.interval = window.setInterval(() => this.runExpire(), period_in_seconds * SECONDS);
        }
    }

    stopExpireInterval(): void {
        if (this.interval !== undefined) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }


    runExpire() {
        const old = Date.now() - this.REQUEST_CACHE_MAX_AGE;

        let cacheSize = this.cache.size;

        this.cache.forEach((entry, qk) => {
            if (cacheSize > this.REQUEST_CACHE_MAX_ITEMS || this.cacheCharSize > this.REQUEST_CACHE_MAX_CHARS || entry.time < old) {
                this.cacheCharSize -= entry.size;
                this.cache.delete(qk);
                cacheSize--;
            }
        });
    }

    getStatistic(): {
        items: number, itemsMax: number
        memory: number, memoryMax: number,
        hits: number, isOld: number, miss: number,
        oldest: number,
        itemSizeMin: number, itemSizeMax: number
    } {
        const first = this.cache.entries().next();
        const oldest = Date.now() - first.value[1].time;

        return {
            items: this.cache.size,
            itemsMax: this.REQUEST_CACHE_MAX_ITEMS,
            memory: this.cacheCharSize,
            memoryMax: this.REQUEST_CACHE_MAX_CHARS,
            hits: this.cacheHit,
            isOld: this.cacheMiss,
            miss: this.cacheNotFound,
            oldest,
            itemSizeMin: this.itemSizeMin,
            itemSizeMax: this.itemSizeMax
        }
    }
}