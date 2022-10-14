/* eslint-disable unicorn/filename-case */
import { PluginManager } from "./plugin_manager";


export class IITCMain {
    readonly plugins: PluginManager;

    constructor() {
        this.plugins = new PluginManager();
    }

    init(): void {
        /** fillme */
        setTimeout(() => this.onIdle(), 10);
    }

    private onIdle(): void {
        this.plugins.migrateOld();
        this.plugins.initialize();
    }
}


export const IITC = new IITCMain();