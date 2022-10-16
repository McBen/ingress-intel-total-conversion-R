import { Plugin } from "./plugins";
import { Options } from "./helper/options";
import { PluginMigrated } from "./plugin_migrated";

export class PluginManager {

    private plugins: Plugin[];
    private options: Options<string>;

    constructor() {
        this.plugins = [];
        this.options = new Options("iitc_plugins");
    }

    migrateOld(): void {
        // TODO: parse bootplugins and convert
        window.bootPlugins.forEach(bootPlugin => {
            const plugin = new PluginMigrated(bootPlugin);
            this.plugins.push(plugin);
        });
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