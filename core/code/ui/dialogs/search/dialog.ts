import { MILLISECONDS } from "../../../helper/times";
import { search } from "./search";

const SEARCH_DELAY = 500 * MILLISECONDS;

export class SearchDialog {

    private timer: number | undefined;

    constructor() {
        this.show();
    }

    show(): void {

        $("#searchwrapper").remove();

        const input = $("<input>", {
            id: "search",
            placeholder: "Search location…",
            type: "search"
        })
            .on("keypress", event => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const term = input.val() as string;

                clearTimeout(this.timer);
                search.doSearch(term, true);
            })
            .on("keyup keypress change paste", () => {
                clearTimeout(this.timer);
                this.timer = window.setTimeout(() => {
                    const term = input.val() as string;
                    search.doSearch(term, false);
                }, SEARCH_DELAY);
            });


        const html = $("<div>", { id: "searchwrapper" }).append(
            $("<div>", { id: "searchdecorator" }).append(
                input
            )
        );

        dialog({
            title: "Search",
            html,
            resizable: true
        })
    }
}