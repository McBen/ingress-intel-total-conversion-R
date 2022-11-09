/* eslint-disable unicorn/filename-case */
import { idle } from "./map/idle";
import { setupMap } from "./map/map";
import { setupDataTileParameters } from "./map/map_data_calc_tools";
import { MapDataRequest } from "./map/map_data_request";
import { PluginManager } from "./plugin/plugin_manager";
import { updateGameScore } from "./ui/gamescore";
import { setupMenu } from "./ui/menu/menu";
import { ON_MOVE_REFRESH, requests } from "./helper/send_request";
import { Log, LogApp } from "./helper/log_apps";
import { hooks, Hooks } from "./helper/hooks";
const log = Log(LogApp.Main);


export class IITCMain {
    readonly plugins: PluginManager;

    public mapDataRequest: MapDataRequest;

    /**
     * Hook interface
     * (for 3rd party use)
     */
    public hooks: Hooks;


    constructor() {
        this.plugins = new PluginManager();
        this.hooks = hooks;
    }


    init(): void {
        log.info("init: page setup");

        setupDataTileParameters();
        setupMap();

        log.info("init: data requests");
        idle.reset()
        this.mapDataRequest = new MapDataRequest();

        updateGameScore();

        log.info("init: UI");
        setupMenu();

        log.info("start requests");
        this.mapDataRequest.start();
        requests.startRefreshTimeout(ON_MOVE_REFRESH);

        setTimeout(() => this.onIdle(), 10);
    }

    private onIdle(): void {
        log.info("init: Plugins");
        this.plugins.migrateOld();
        this.plugins.initialize();
    }
}


export const IITC = new IITCMain();