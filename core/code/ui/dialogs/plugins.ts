import { IITCr } from "../../IITC";
import { Plugin } from "../../plugin/plugin_base";
import { PluginMigrated } from "../../plugin/plugin_migrated";
import { dialog } from "../dialog";

export class PluginDialog {

    private dialog: JQuery;

    show(): void {

        const html = $("<div>", { class: "container" }).append(
            this.createHeader(),
            this.createList()
        );

        this.dialog = dialog({
            html,
            id: "plugins",
            title: "Plugins",
            width: 500
        })
    }


    private createHeader(): JQuery {
        return $("<div>", { class: "head" }).append(
            $("<select>", {
                id: "filterstatus",
                change: () => this.updateList()
            }).append(
                $("<option>", { text: "all", value: "all" }),
                $("<option>", { text: "active", value: "active" }),
                $("<option>", { text: "not active", value: "inactive" }),
                $("<option>", { text: "external", value: "external" }),
                $("<option>", { text: "stock", value: "stock" })
            ),
            $("<input>", { type: "text", id: "filtertext" }).on("input", () => this.updateList()),
        );
    }


    private createList(): JQuery {

        const plugins = this.getFilteredPlugins();

        const entries = plugins.map(p => this.createPluginCard(p));
        return $("<div>", { id: "pluginlist" }).append(entries);
    }


    private createPluginCard(plugin: Plugin): JQuery {
        return $("<div>", { class: "card" }).append(
            $("<input>", {
                type: "checkbox",
                checked: plugin.isActive(),
                change: (event: JQuery.ChangeEvent) => this.togglePlugin(plugin, event)
            }),
            $("<div>", { class: "title", text: plugin.name }),
            $("<span>", { text: plugin.version }),
            plugin.error ? $("<div>", { class: "error", text: plugin.error }) : "",
            $("<div>", { class: "description", text: plugin.description })
        )
    }


    private updateList(): void {
        const newList = this.createList();

        $("#pluginlist", this.dialog).replaceWith(newList);
    }


    private getFilteredPlugins(): Plugin[] {

        const fstatus = $("#filterstatus", this.dialog).val() as string;
        const ftext = $("#filtertext", this.dialog).val() as string;

        const entries = IITCr.plugins.getAllPlugins().filter(p => {

            switch (fstatus) {
                case "active":
                    if (!p.isActive()) return false;
                    break;
                case "inactive":
                    if (p.isActive()) return false;
                    break;
                case "external":
                    if (!(p instanceof PluginMigrated)) return false;
                    break;
                case "stock":
                    if (p instanceof PluginMigrated) return false;
                    break;
            }

            if (ftext) {
                const ftextLow = ftext.toLowerCase();
                const tagMatch = p.tags && p.tags.some(tag => tag.toLowerCase().includes(ftextLow));
                if (!tagMatch && !p.name.toLowerCase().includes(ftextLow)) return false;
            }

            return true;
        })

        return entries;
    }


    togglePlugin(plugin: Plugin, event: JQuery.ChangeEvent): void {
        if (plugin.isActive()) {
            IITCr.plugins.deactivatePlugin(plugin);
        } else {
            IITCr.plugins.activatePlugin(plugin);
        }

        const newCard = this.createPluginCard(plugin);
        $(event.target).parent().replaceWith(newCard);
    }
}