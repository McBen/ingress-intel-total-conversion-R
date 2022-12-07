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
const log = Log(LogApp.Main);


export class IITCMain {
    readonly plugins: PluginManager;

    public mapDataRequest: MapDataRequest;
    public hooks: Hooks;
    public menu: IITCMenu;
    public layers: LayerManager;


    constructor() {
        this.plugins = new PluginManager();
        this.hooks = hooks;
        this.layers = new LayerManager();
    }


    init(): void {
        log.info("init: page setup");

        setupDataTileParameters();

        log.info("init: UI");
        this.menu = new IITCMenu();
        setupMap();
        this.menu.initMenu();

        log.info("init: data requests");
        idle.reset()
        this.mapDataRequest = new MapDataRequest();
        this.mapDataRequest.start();
        requests.startRefreshTimeout(ON_MOVE_REFRESH);
        updateGameScore();

        if (globalThis.iitcCompabilityInit) {
            log.info("init: finalize compability layer");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            globalThis.iitcCompabilityInit();
        }
        setTimeout(() => this.onIdle(), 10);
    }

    private onIdle(): void {
        log.info("init: Plugins");
        this.plugins.migrateOld();
        this.plugins.initialize();
    }
}


export const IITC = new IITCMain();