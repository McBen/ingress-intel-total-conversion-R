import { DataCache } from "../../../map/data_cache";
import { digits, formatInterval } from "../../../utils_misc";
import { dialog } from "../../dialog";

export class CacheDebug {

    private dialog: JQuery;
    private cache: DataCache<any>;
    private updateTimer: number;

    constructor(cache: DataCache<any>) {
        this.cache = cache;
    }

    show(): void {

        const html = $("<div>").append(
            $("<div>", { id: "items", text: "" }),
            $("<div>", { id: "memory", text: "" }),
            $("<div>", { id: "hits", text: "" }),
            $("<div>", { id: "old", text: "" }),
            $("<div>", { id: "sizes", text: "" })
        )

        this.dialog = dialog({
            html,
            title: "Debug-Cache",
            id: "debug_cache",
            closeCallback: () => this.onClose()
        })

        this.updateTimer = window.setInterval(() => this.update(), 1000);
        this.update();
    }

    update(): void {
        const status = this.cache.getStatistic();

        $("#items", this.dialog).html(this.formatText(status.items, status.itemsMax));
        $("#memory", this.dialog).html(this.formatText(status.memory, status.memoryMax));
        $("#hits", this.dialog).html(`hits: ${status.hits} old: ${status.isOld} miss: ${status.miss} `)
        $("#old", this.dialog).html(`oldest: ${formatInterval(Math.floor(status.oldest / 1000))}`)
        $("#sizes", this.dialog).html(`sizes: ${status.itemSizeMin} to  ${status.itemSizeMax}; mean: ${Math.floor(status.memory / status.items)} `)
    }

    private formatText(current: number, max: number): string {
        const perc = Math.floor(current / max * 100);

        let mes = "";
        if (max > 1000000) {
            mes = "k"
            max = Math.floor(max / 1000);
            current = Math.floor(current / 1000);
        }

        return `${perc}% ${digits(current)}${mes} / ${digits(max)}${mes} `;
    }

    onClose(): void {
        window.clearInterval(this.updateTimer);
    }
}