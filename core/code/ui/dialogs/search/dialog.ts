import { MILLISECONDS } from "../../../helper/times";
import { dialog } from "../../dialog";
import { Query } from "./query";
import { initSearch } from "./search";

const SEARCH_DELAY = 500 * MILLISECONDS;

export class SearchDialog {

    private timer: number | undefined;
    private search: Query;

    constructor() {
        this.show();
        initSearch();
    }


    show(): void {

        const input = $("<input>", {
            id: "search",
            placeholder: "Search location…",
            type: "search",
            class: "w-full"
        })
            .on("keypress", event => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const term = input.val() as string;

                clearTimeout(this.timer);
                this.doSearch(term, true);
            })
            .on("keyup keypress change paste", () => {
                clearTimeout(this.timer);
                this.timer = window.setTimeout(() => {
                    const term = input.val() as string;
                    this.doSearch(term, false);
                }, SEARCH_DELAY);
            });

        this.search = new Query();


        const html = $("<div>", { id: "searchwrapper" }).append(
            input,
            this.search.getContainer()
        );

        dialog({
            title: "Search",
            html,
            resizable: true,
            closeCallback: () => {
                this.search.clear();
            }
        })
    }


    private doSearch(term: string, confirmed: boolean): void {
        term = term.trim();

        // minimum 3 characters for automatic search
        if (term.length < 3 && !confirmed) return;

        this.search.query(term, confirmed);
    }

}