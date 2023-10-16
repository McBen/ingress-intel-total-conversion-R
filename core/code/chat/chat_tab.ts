import { GLOPT, IITCOptions } from "../helper/options";

export abstract class ChatTab {
    abstract name;
    abstract initInput(mark: JQuery, input: JQuery);


    createTab(index: number): void {
        const keyShortCut = index.toString();
        const tab = $("<a>", {
            id: this.name,
            title: "[" + keyShortCut + "]", accesskey: keyShortCut,
            text: this.name,
            class: "chatloggertab",
            click: () => this.show()
        });
        $("#chatcontrols").append(tab);

        $("#chat").append(
            $("<div>", { id: this.name, style: "display:none" }).append(
                $("<table>")
            )
        )
    }


    getTabControl(): JQuery {
        return $("#chatcontrols #" + this.name);
    }


    show(): void {
        IITCOptions.set(GLOPT.CHAT_TAB, this.name);

        $("#chatcontrols .active").removeClass("active");
        $("#chatcontrols #" + this.name).addClass("active");

        const mark = $("#chatinput mark");
        const input = $("#chatinput input");
        this.initInput(mark, input);
    }


    renderDivider(text) {
        return '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>";
    }

}
