import { Plugin } from "./plugins";
import anylogger from "anylogger"
import { BootCallback } from "../../../types";
import { LogApp } from "../helper/log_apps";

const log = anylogger(LogApp.Plugins);


export class PluginMigrated extends Plugin {

    private setup: () => void;
    private wasDeactivated: boolean | undefined;

    constructor(iitcPlugin: BootCallback) {
        super();
        this.setup = iitcPlugin;

        this.name = "old-iitc-plugin";
        this.version = "unknown";
        this.description = "";
        this.author = "unknown";

        if (iitcPlugin.info) {
            this.name = iitcPlugin.info.pluginId || this.name;
            this.version = iitcPlugin.info.dateTimeVersion || this.version;

            if (iitcPlugin.info.script) {
                this.name = iitcPlugin.info.script.name || this.name;
                this.version = iitcPlugin.info.script.version || this.version;
                this.description = iitcPlugin.info.script.description || this.description;
            }
        }

        this.name = this.name.replace(/^IITC[\s-]+plugin:\s+/i, "");
    }


    activate(): void {
        this.error = undefined;

        if (this.wasDeactivated) {
            // prevent multiple init calls if user re-activate plugin
            this.wasDeactivated = undefined;
            return;
        }

        require("../iitc_compability");

        log.info("Starting Plugin", this.name);
        this.setup();
    }


    deactivate(): void {
        this.error = "need reload to deactivate plugin";
        this.wasDeactivated = true;
    }
}