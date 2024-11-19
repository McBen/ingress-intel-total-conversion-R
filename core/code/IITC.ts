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
Object.defineProperty(window, "links", {
    get: (): Record<string, IITC.Link> => {
        console.warn("window.links getter has bad performace. Better use IITCr.links.get(guid)");
        // console.trace("window.links getter");
        return IITCr.links.toOldObject();
    },
});

class Links {
    public all: IITC.Link[];

    constructor() {
        this.all = [];
    }

    get(guid: LinkGUID): IITC.Link | undefined {
        return this.all.find(f => f.options.guid === guid);
    }

    add(link: IITC.Link) {
        this.all.push(link);
    }

    remove(guid: LinkGUID): IITC.Link | undefined {
        const index = this.all.findIndex(f => f.options.guid === guid);
        if (index >= 0) {
            return this.all.splice(index, 1)[0];
        }
        return;
    }


    getByPortal(guid: PortalGUID): { in: IITC.Link[], out: IITC.Link[] } {
        const l_in = this.all.filter(l => l.options.data.dGuid === guid);
        const l_out = this.all.filter(l => l.options.data.oGuid === guid);

        return { in: l_in, out: l_out };
    }

    toOldObject(): Record<string, IITC.Link> {
        const result: Record<string, IITC.Link> = {};
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

    public links: Links;

    constructor() {
        this.plugins = new PluginManager();
        this.hooks = hooks;
        this.layers = new LayerManager();
        this.highlighter = new Highlighters();

        this.links = new Links();
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