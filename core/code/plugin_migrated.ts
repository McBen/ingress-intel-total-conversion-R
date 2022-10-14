import { Plugin } from "./plugins";

export class PluginMigrated extends Plugin {

    private setup: () => void;

    constructor(setupFunction: () => void) {
        super();
        this.setup = setupFunction;
    }


    activate(): void {
        this.setup();
        this.error = undefined;
    }


    deactivate(): void {
        this.error = "need reload to deactive plugin";
    }
}