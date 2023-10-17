import { IITC } from "../IITC";


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


    renderDivider(text) {
        return '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>";
    }



    private addRow(row: string): void {
        if (this.delayedLines.length === 0 && window.chat.getActive() === "RESWUE") {
            window.setTimeout(() => this.addDelayedRows(), CHAT_ADD_DELAY);
        }
        this.delayedLines.push(row);
    }


    private addDelayedRows(): void {
        const elm = $("#chatlog");
        const scrollBefore = window.scrollBottom(elm);

        $("table", elm).append($(this.delayedLines.join("")));
        this.currentLines += this.delayedLines.length;
        this.delayedLines = [];

        if (this.currentLines > MAX_LINES) {
            const lines = $("#chatlog table tr");
            lines.slice(0, REMOVE_LINES).remove();
            this.currentLines = lines.length;
        }

        if (scrollBefore < 1) {
            elm.scrollTop(elm.scrollTop()! + (window.scrollBottom(elm) - scrollBefore));
        }
    }

}
