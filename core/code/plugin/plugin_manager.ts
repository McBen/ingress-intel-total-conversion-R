import { Plugin } from "./plugins";
import { Options } from "../helper/options";
import { PluginMigrated } from "./plugin_migrated";

export class PluginManager {

    private plugins: Plugin[];
    private options: Options<string>;

    constructor() {
        this.plugins = [];
        this.options = new Options("IITC_plugins");
    }

    migrateOld(): void {
        window.bootPlugins.forEach(bootPlugin => {
            const plugin = new PluginMigrated(bootPlugin);
    }


    initialize(): void {
        this.plugins.forEach(plugin => {
            if (this.options.getSafe(plugin.name, true)) {
                plugin.enable(this);
            }
        })
    }


    getPlugin(name: string): Plugin | undefined {
        return this.plugins.find(p => p.name === name);
    }


}