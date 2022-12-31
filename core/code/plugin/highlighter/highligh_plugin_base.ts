import { Plugin } from "../plugin_base";
import { IITC } from "../../IITC";


export abstract class PluginHighlight extends Plugin {
    protected abstract menuName: string;

    abstract highlight(_portal: IITC.Portal): void;
    activate(): void {
        IITC.highlighter.add({ name: this.menuName, highlight: (portal: IITC.Portal) => this.highlight(portal) });
    }

    deactivate(): void {
        IITC.highlighter.remove(this.menuName);
    }
}
