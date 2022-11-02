/* eslint-disable unicorn/filename-case */
import { idle } from "./map/idle";
import { setupMap } from "./map/map";
import { setupDataTileParameters } from "./map/map_data_calc_tools";
import { MapDataRequest } from "./map/map_data_request";
import { PluginManager } from "./plugin/plugin_manager";
import { checkCookieLaw } from "./ui/dialogs/cookielaw";
import { updateGameScore } from "./ui/gamescore";
import { setupMenu } from "./ui/menu/menu";

import { Log, LogApp } from "./helper/log_apps";
import { ON_MOVE_REFRESH, startRefreshTimeout } from "./helper/send_request";
const log = Log(LogApp.Main);


export class IITCMain {
    readonly plugins: PluginManager;
    public mapDataRequest: MapDataRequest;

    constructor() {
        this.plugins = new PluginManager();
    }

    init(): void {
        log.info("init: page setup");
        checkCookieLaw();

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
        startRefreshTimeout(ON_MOVE_REFRESH);

        /** fillme */
        setTimeout(() => this.onIdle(), 10);
    }

    private onIdle(): void {
        log.info("init: Plugins");
        this.plugins.migrateOld();
        this.plugins.initialize();
    }
}


export const IITC = new IITCMain();