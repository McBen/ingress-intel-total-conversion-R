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
import { Fields } from "./data/fields";
const log = Log(LogApp.Main);

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

        this.fields = new Fields();
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