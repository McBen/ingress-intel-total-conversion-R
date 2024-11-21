/* eslint-disable unicorn/filename-case */
import { idle } from "./map/idle";
import { setupMap } from "./map/map";
import { setupDataTileParameters } from "./map/map_data_calc_tools";
import { MapDataRequest } from "./map/map_data_request";
import { PluginManager } from "./plugin/plugin_manager";
import { updateGameScore } from "./ui/gamescore";
import { IITCMenu } from "./ui/menu/menu";
import { ON_MOVE_REFRESH, requests } from "./helper/send_request";
import { Log, LogApp } from "./helper/log_apps";
import { hooks, Hooks } from "./helper/hooks";
import { LayerManager } from "./map/layers";
import { Highlighters } from "./portal/highlighters";
import { Artifacts } from "./artifact";
import { setupSidebar } from "./ui/sidebar";
import { setupLogWindow } from "./ui/log";
const log = Log(LogApp.Main);


// TODO: FOR COMPATIBILITY -> move to iitc-comp layer
Object.defineProperty(window, "fields", {
    get: (): any => {
        console.warn("window.fields getter has bad performace. Better use IITCr.fields.get(guid)");
        // console.trace("window.fields getter");
        return IITCr.fields.toOldObject();
    },
});

class Fields {
    public all: IITC.Field[];

    constructor() {
        this.all = [];
    }

    get(guid: FieldGUID): IITC.Field | undefined {
        return this.all.find(f => f.options.guid === guid);
    }


    add(field: IITC.Field) {
        this.all.push(field);
    }


    remove(guid: FieldGUID): IITC.Field | undefined {
        const index = this.all.findIndex(f => f.options.guid === guid);
        if (index >= 0) {
            return this.all.splice(index, 1)[0];
        }
        return;
    }


    getByPortal(guid: PortalGUID): IITC.Field[] {
        return this.all.filter(f => {
            const d = f.options.data;
            return d.points[0].guid === guid || d.points[1].guid === guid || d.points[2].guid === guid;
        })
    }

    /**
     * Fields with atleast one Vertex in area
     */
    getInBounds(bounds: L.LatLngBounds): IITC.Field[] {
        return this.all.filter(field => {
            const points = field.getLatLngs();
            return bounds.contains(points[0]) || bounds.contains(points[1]) || bounds.contains(points[2]);
        })
    }

    toOldObject(): Record<string, IITC.Field> {
        const result: Record<string, IITC.Field> = {};
        this.all.forEach(f => result[f.options.guid] = f);
        return result;
    }
}


export class IITCMain {
    readonly plugins: PluginManager;

    public mapDataRequest: MapDataRequest;
    public hooks: Hooks;
    public menu: IITCMenu;
    public layers: LayerManager;
    public highlighter: Highlighters;
    public artifacts: Artifacts;

    public fields: Fields;


    constructor() {
        this.plugins = new PluginManager();
        this.hooks = hooks;
        this.layers = new LayerManager();
        this.highlighter = new Highlighters();

        this.fields = new Fields;
    }


    init(): void {
        log.info("init: page setup");

        setupDataTileParameters();

        log.info("init: UI");
        this.menu = new IITCMenu();
        setupMap();
        this.menu.initMenu();

        setupSidebar();
        setupLogWindow();


        log.info("init: data requests");
        idle.reset()
        this.mapDataRequest = new MapDataRequest();
        this.mapDataRequest.start();
        this.artifacts = new Artifacts();
        requests.startRefreshTimeout(ON_MOVE_REFRESH);
        updateGameScore();

        if ((globalThis as any).iitcCompabilityInit) {
            log.info("init: finalize compability layer");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            (globalThis as any).iitcCompabilityInit();
        }
        setTimeout(() => this.onIdle(), 10);
    }

    private onIdle(): void {
        log.info("init: Plugins");
        this.plugins.migrateOld();
        this.plugins.initialize();
    }
}


export const IITCr = new IITCMain();
(globalThis as any).IITCr = IITCr;