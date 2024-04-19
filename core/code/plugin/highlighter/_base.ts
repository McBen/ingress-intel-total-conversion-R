import { Plugin } from "../plugin_base";
import { IITCr } from "../../IITC";


export abstract class PluginHighlight extends Plugin {
    protected abstract menuName: string;

    abstract highlight(_portal: IITC.Portal): void;
    activate(): void {
        IITCr.highlighter.add({ name: this.menuName, highlight: (portal: IITC.Portal) => this.highlight(portal) });
    }

    deactivate(): void {
        IITCr.highlighter.remove(this.menuName);
    }
}
