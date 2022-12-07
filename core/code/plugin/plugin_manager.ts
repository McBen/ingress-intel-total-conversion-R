import { Plugin } from "./plugin_base";
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
            if (this.options.getSafe(plugin.name, !plugin.defaultInactive)) {
                plugin.enable(this);
            }
        })
    }


    getPlugin(name: string): Plugin | undefined {
        return this.plugins.find(p => p.name === name);
    }


    getListOfActivePlugins(): string[] {
        return this.plugins.filter(p => p.isActive())
            .map(p => p.name);
    }

    getAllPlugins(): Plugin[] {
        return this.plugins;
    }


    activatePlugin(plugin: Plugin): void {
        this.options.set(plugin.name, true);
        if (!plugin.isActive()) {
            plugin.enable(this);
        }
    }

    deactivatePlugin(plugin: Plugin): void {
        this.options.set(plugin.name, false);
        if (plugin.isActive()) {
            plugin.disable(this);
        }
    }
}