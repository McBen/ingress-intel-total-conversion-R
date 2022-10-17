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
            this.add(plugin);
        });
        window.bootPlugins = [];
    }


    private add(plugin: Plugin): void {
        const basename = plugin.name;
        let index = 0;
        while (this.getPlugin(plugin.name)) {
            index++;
            plugin.name = `${basename}-${index}`;
        }
        this.plugins.push(plugin);
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