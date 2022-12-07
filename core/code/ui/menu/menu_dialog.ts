import { IITCMenu, MenuDefinition } from "./menu";

export interface MenuEntry {
    name: string,
    element: JQuery;
    shortcut?: string,
    hasCheckbox?: boolean,
    isEnabled?: () => boolean,
    isChecked?: () => boolean,
    subMenu?: MenuDialog;
    id?: string;
}


export class MenuDialog {

    protected root: JQuery;
    protected entries: MenuEntry[];
    private parent?: MenuDialog;

    constructor(parent?: MenuDialog) {
        this.root = $("<div>", { class: "menudialog" });
        this.entries = [];
        this.parent = parent;
    }

    private getRoot(): IITCMenu {
        // eslint-disable-next-line unicorn/no-this-assignment,@typescript-eslint/no-this-alias
        let root: MenuDialog = this;
        while (root.parent) root = root.parent;
        return root as IITCMenu;
    }

    getSubMenu(menuPath: string[]): MenuDialog {
        if (menuPath.length === 0) return this;

        const pathName = menuPath.splice(0, 1)[0];

        let entry = this.entries.find(f => f.name.toLowerCase() === pathName.toLowerCase());
        if (!entry) {
            entry = this.addEntryDirectly(pathName, {});
        }

        if (!entry.subMenu) {
            this.addSubMenu(entry);
        }

        return entry.subMenu.getSubMenu(menuPath);
    }

    addSeparator(menuPath: string): void {
        const path = menuPath.split("\\");
        const menu = this.getSubMenu(path);
        menu.addSeparatorDirectly();
    }

    private addSeparatorDirectly(): void {
        const element = $("<div>", { class: "menuitem separator" });
        this.root.append(element);
    }


    addEntry(options: Partial<MenuDefinition>): void {
        const name = options.name || "unknown";
        const menuPath = name.split("\\");
        const menuName = menuPath.splice(-1, 1)[0];

        const menu = this.getSubMenu(menuPath);

        menu.addEntryDirectly(menuName, options);
    }

    protected addEntryDirectly(name: string, options: Partial<MenuDefinition>): MenuEntry {
        console.assert(!options.id || !this.entries.some(l => l.id === options.id), "Menu-ID already used", options.id);

        const element = this.createMenuEntry(name, options);

        const entry: MenuEntry = {
            name,
            shortcut: options.shortcut,
            hasCheckbox: options.hasCheckbox,
            isEnabled: options.isEnabled,
            isChecked: options.isChecked,
            element,
            id: options.id
        }
        entry.element.on("mouseenter", () => this.showSubmenu(entry));

        this.entries.push(entry);
        this.root.append(element);

        return entry;
    }

    removeEntry(id: string): boolean {
        const entryIndex = this.entries.findIndex(l => l.id === id);
        if (entryIndex >= 0) {
            this.entries[entryIndex].element.remove();
            this.entries.splice(entryIndex, 1);
            return true;
        }

        const foundInSub = this.entries.some(sub => {
            if (sub.subMenu) {
                return sub.subMenu.removeEntry(id);
            }
            return false;
        });

        return foundInSub;
    }


    protected createMenuEntry(name: string, options: Partial<MenuDefinition>): JQuery {
        const element = $("<div>", { class: "menuitem", id: options.id, text: name });
        if (options.hasCheckbox) {
            element.prepend($("<div>", { class: "menu_checkbox" }));
        }
        if (options.onClick) {
            element.on("click", () => {
                if (options.isEnabled && !options.isEnabled()) return;

                const keepOpen = options.onClick();

                if (keepOpen) {
                    this.updateEntries();
                } else {
                    this.getRoot().deactivateMenu();
                }
            });
        }

        return element;
    }

    menutext(title: string): string {
        const result = title.replace(/([a-z]+)/g, char => `<span class="upper">${char}</span>`)
        return result;
    }

    protected addSubMenu(entry: MenuEntry): void {
        entry.subMenu = new MenuDialog(this);
        if (this.parent) {
            entry.element.append($("<span>", { class: "menu-arrow", text: "►" }));
        }

        entry.subMenu.root.hide();
        $("body").append(entry.subMenu.root);
    }

    showSubmenu(entry: MenuEntry): void {
        this.hideChildren();

        if (entry.subMenu) {
            entry.subMenu.show({
                of: entry.element,
                my: "left top",
                at: "right top"
            })
        }
    }


    hide(): void {
        this.root.hide();
        this.hideChildren();
    }

    hideChildren(): void {
        this.entries.forEach(f => {
            if (f.subMenu) f.subMenu.hide();
        });
    }

    show(position: JQueryUI.JQueryPositionOptions): void {
        this.updateEntries();

        this.root.show();
        this.root.position(position)
    }

    updateEntries(): void {
        this.entries.forEach(f => {
            const disabled = f.isEnabled && !f.isEnabled();
            f.element.toggleClass("disabled", disabled ? true : false);

            if (f.hasCheckbox) {
                const checked = f.isChecked && f.isChecked();
                $(".menu_checkbox", f.element).toggleClass("checked", checked);
            }
        });
    }
}