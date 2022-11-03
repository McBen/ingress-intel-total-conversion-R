import { toast } from "../ui/toast";

/**
 * Store items in localstorage.
 */
export class Options<OT extends string> {

    private key: string;
    private data: { [key: string]: any } = {};

    constructor(key: string) {
        this.key = key;
        this.load();

    }

    get<T>(item: OT): T | undefined {
        return this.data[item];
    }

    getSafe<T>(item: OT, fallback: T): T {
        const data = <T | undefined>this.data[item];
        return data !== undefined ? data : fallback;
    }

    set<T>(item: OT, data: T): void {
        this.data[item] = data;
        this.save();
    }

    remove(item: OT): void {
        this.data[item] = undefined;
        this.save();
    }

    private load(): void {
        this.data = {};
        const djson = window.localStorage.getItem(this.key);
        if (djson) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            this.data = JSON.parse(djson);
        }
    }

    private save(): void {
        try {
            window.localStorage.setItem(this.key, JSON.stringify(this.data));
        } catch (error) {
            if (error instanceof Error) {
                toast("can't store settings: " + error.message);
            } else {
                toast("can't store settings");
            }
        }
    }
}


export const enum GLOPT {
    SHOW_ZOOM_BUTTONS = "zoombut",
    BASE_MAP_LAYER = "bmap"
}

export const IITCOptions = new Options<GLOPT>("IITC_OPT");
