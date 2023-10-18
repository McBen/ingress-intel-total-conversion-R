import { IITC } from "../IITC";
import { scrollBottom } from "../helper/utils_misc";


export abstract class ChatTab {
    abstract name;
    abstract initInput(mark: JQuery, input: JQuery);
    protected table: JQuery;


    createTab(index: number): void {
        const keyShortCut = (index + 1).toString();
        const tab = $("<a>", {
            id: this.name,
            title: "[" + keyShortCut + "]", accesskey: keyShortCut,
            text: this.name,
            class: "chatloggertab",
            click: () => IITC.chat.chooseTab(this.name)
        });
        $("#chatcontrols").append(tab);

        this.table = $("<table>");
        $("#chat").append(
            $("<div>", { id: this.name }).hide() // TODO: is DIV required?
        )
    }


    getTabControl(): JQuery {
        return $("#chatcontrols #" + this.name);
    }


    show(): void {
        $("#chatcontrols .active").removeClass("active");
        $("#chatcontrols #" + this.name).addClass("active");

        const mark = $("#chatinput mark");
        const input = $("#chatinput input");
        this.initInput(mark, input);

        $("#chat > div").show();
        $("#chat > div").append(this.table);
    }


    hide(): void {
        $("#chat > div").hide();
        this.table.remove();
    }


    appendRows(row: string[]): void {
        const scrollBefore = scrollBottom(this.table);

        this.table.append(row.join(""));

        if (scrollBefore < 1) {
            this.table.scrollTop(this.table.scrollTop()! + (scrollBottom(this.table) - scrollBefore));
        }
    }


    prependRows(row: string[]): void {
        this.table.prepend(row.join(""));
    }


    renderDivider(text) {
        return '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>";
    }
}
