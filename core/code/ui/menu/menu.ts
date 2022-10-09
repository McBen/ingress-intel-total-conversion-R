/* eslint-disable no-underscore-dangle */
import { initializeMenu } from "./menu_actions";
import { MenuDialog, MenuEntry } from "./MenuDialog";


export type MenuDefinition = {
    id: string,
    name: string,
    shortcut?: string,
    hasCheckbox?: boolean,
    icon?: string,
    /**
     * @return true to keep menu open
     */
    onClick?: () => boolean | void,
    isEnabled?: () => boolean,
    isChecked?: () => boolean,
}

export type LayerGroups = { [id: string]: string[] };


declare global {
    interface Highlighter {
        hightlight: (portal: any) => void;
    }
    let _highlighters: { [name: string]: Highlighter } | null;
    let _current_highlighter: string | undefined;
    function changePortalHighlights(name: string | undefined): void;
}


export class IITCMenu extends MenuDialog {

    private isActive: boolean;

    constructor() {
        super();

        this.root.attr("class", "iitcbars");
    }

    getBaseMenuElement(): JQuery {
        return this.root;
    }


    protected createMenuEntry(name: string, options: Partial<MenuDefinition>): JQuery {
        const element = $("<div>", { class: "titlemenuitem", id: options.id }).html(this.menutext(name));
        return element;
    }

    protected addEntryDirectly(name: string, options: Partial<MenuDefinition>): MenuEntry {
        const entry = super.addEntryDirectly(name, options);

        entry.element.on("click", () => {
            this.toggleMenu();
            this.showSubmenu(entry);
        });

        return entry;
    }

    showSubmenu(entry: MenuEntry): void {
        if (!this.isActive) return;
        if (!entry.subMenu) return;

        this.hideOthers(entry.subMenu);

        entry.subMenu.show({
            of: entry.element,
            my: "left top",
            at: "left bottom"
        })
    }


    toggleMenu(): void {
        if (this.isActive) {
            this.deactivateMenu();
        } else {
            this.activateMenu();
        }
    }


    activateMenu(): void {
        if (this.isActive) {
            console.warn("menu already active")
            return;
        }

        this.isActive = true;
        $("body").on("click", this.onAnyClick);
    }

    deactivateMenu(): void {
        if (!this.isActive) {
            console.warn("menu already inactive")
            return;
        }

        this.hide();

        this.isActive = false;
        $("body").off("click", this.onAnyClick);
    }

    hide(): void {
        this.entries.forEach(f => {
            if (f.subMenu) f.subMenu.hide();
        });
    }

    hideOthers(menu: MenuDialog): void {
        this.entries.forEach(f => {
            if (f.subMenu && f.subMenu !== menu) f.subMenu.hide();
        });
    }

    onAnyClick = (event: JQuery.MouseEventBase): void => {
        console.assert(this.isActive, "not active but handler is registered?!?");

        if ($(event.target).closest(".menudialog").length === 0 &&
            $(event.target).closest(".titlemenuitem").length === 0) {
            this.deactivateMenu();
        }
    }


    migrateToolbox(mapping: Map<string, string>): void {

        $("#toolbox").children().each((inddex, element) => {
            const name = $(element).text();

            let newname = mapping.get(name);
            if (newname === "") return;
            if (!newname) newname = "misc\\" + name;

            this.addEntry({
                name: newname,
                onClick: () => {
                    $(element).trigger("click");
                    return;
                }
            })
        });
    }

    migrateLayers(layerGroups: LayerGroups): void {
        this.migrateBaseLayers();
        this.addSeparator("layer");
        this.migrateOverlayLayers(layerGroups);
    }

    private migrateBaseLayers(): void {
        const layers = layerChooser.getLayers();

        layers.baseLayers.forEach(bl => {
            this.addEntry({
                name: "layer\\Base Layer\\" + bl.name,
                onClick: () => {
                    layerChooser.showLayer(bl.layerId, true);
                    return false;
                },
                isChecked: () => this.isLayerVisible(bl.layerId),
                hasCheckbox: true
            })
        })
    }


    private migrateOverlayLayers(layerGroups: LayerGroups): void {
        const processed: string[] = [];
        const layers = layerChooser.getLayers();

        // eslint-disable-next-line guard-for-in
        for (const group in layerGroups) {
            layerGroups[group].forEach(name => {
                const layer = layers.overlayLayers.find(f => f.name === name);
                if (layer) {
                    this.addOverlayLayer(group + "\\", layer);
                    processed.push(name);
                }
            })
        }

        layers.overlayLayers.forEach(ol => {
            if (!processed.includes(ol.name)) {
                this.addOverlayLayer("", ol);
            }
        })
    }

    private addOverlayLayer(basename: string, ol: LayerInfo): void {
        this.addEntry({
            name: "layer\\" + basename + ol.name,
            onClick: () => {
                (window.layerChooser as any).showLayer(ol.layerId, !this.isLayerVisible(ol.layerId));
                return true;
            },
            isChecked: () => this.isLayerVisible(ol.layerId),
            hasCheckbox: true
        })
    }

    isLayerVisible(id: number): boolean {
        // eslint-disable-next-line no-underscore-dangle
        return window.map.hasLayer((window.layerChooser as any)._layers[id].layer);
    }

    migrateHighlighters(): void {
        if (!_highlighters) return;

        // eslint-disable-next-line guard-for-in
        for (const hil in _highlighters) {
            this.addEntry({
                name: "View\\Hightlight\\" + hil,
                onClick: () => changePortalHighlights(_current_highlighter === hil ? undefined : hil),
                hasCheckbox: true,
                isChecked: () => (_current_highlighter === hil)
            });
        }
    }
}


export const setupMenu = (): void => {

    const iitcmenu = new IITCMenu();

    initializeMenu(iitcmenu);

    const menu = $("<div>", { class: "iitcontainer" }).append(
        iitcmenu.getBaseMenuElement()
    );

    $("body").append(menu);
}
