import { PluginManager } from "./plugin_manager";
import { Log, LogApp } from "../helper/log_apps";
const log = Log(LogApp.Plugins);

export class Plugin {

    public name: string;
    public version: string;
    public description: string;
    public author: string;
    public tags?: string[];
    public requires?: string[];
    public defaultInactive?: boolean;

    public error?: string;
    private activated: number = 0;


    enable(manager: PluginManager): boolean {
        if (!this.activateRequirements(manager)) return false;

        log.info("Start", this.name);

        /* RELEASE-START */
        try {
            /* RELEASE-END */
            this.activate();
            /* RELEASE-START */
        } catch {
            this.error = "failed to initialize";
            return false;
        }
        /* RELEASE-END */

        this.activated++;
    }


    disable(manager: PluginManager): void {
        console.assert(this.activated > 0, "plugin is not active")
        this.activated--;
        if (this.activated <= 0) {
            this.deactivateRequirements(manager);

            log.info("Stop", this.name);
            this.deactivate();
        }
    }


    private activateRequirements(manager: PluginManager): boolean {
        if (!this.requires) return true;

        return !this.requires.some(dependency => {
            const plugin = manager.getPlugin(dependency);
            if (!plugin) {
                this.error = `requires plugin: ${dependency}`;
                return false;
            }

            if (!plugin.enable(manager)) {
                this.error = `required plugin: ${dependency} cannot be activated`;
                return false;
            }
        })
    }

    private deactivateRequirements(manager: PluginManager): void {
        if (!this.requires) return;

        this.requires.forEach(dependency => {
            const plugin = manager.getPlugin(dependency);
            console.assert(plugin, `requires plugin: ${dependency} was not loaded`);
            if (plugin) {
                plugin.disable(manager);
            }
        })
    }


    isActive(): boolean {
        return this.activated > 0;
    }


    activate(): void {
        /** overwrite me */
    }

    deactivate(): void {
        /** overwrite me */
    }
}