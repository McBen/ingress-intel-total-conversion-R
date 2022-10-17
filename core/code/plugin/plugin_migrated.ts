import { Plugin } from "./plugins";
import anylogger from "anylogger"
import { BootCallback } from "../../../types";
import { LogApp } from "../IITC";

const log = anylogger(LogApp.Plugins);

export class PluginMigrated extends Plugin {

    private setup: () => void;

    constructor(iitcPlugin: BootCallback) {
        super();
        this.setup = iitcPlugin;

        this.name = "old-iitc-plugin";
        this.version = "unknown";
        this.description = "";

        if (iitcPlugin.info) {
            this.name = iitcPlugin.info.pluginId || this.name;
            this.version = iitcPlugin.info.dateTimeVersion || this.version;

            if (iitcPlugin.info.script) {
                this.name = iitcPlugin.info.script.name || this.name;
                this.version = iitcPlugin.info.script.version || this.version;
                this.description = iitcPlugin.info.script.description || this.description;
            }
        }
    }


    activate(): void {
        log.info("Starting Plugin", this.name);
        this.setup();
        this.error = undefined;
    }


    deactivate(): void {
        this.error = "need reload to deactive plugin";
    }
}