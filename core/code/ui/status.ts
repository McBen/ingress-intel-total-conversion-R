import { getDataZoomForMapZoom, getMapZoomTileParameters, TileParameters } from "../map/map_data_calc_tools";

export interface MapStatus {
    total: number;
    done: number;
    failed: number;
}


export class MapStatusBar {

    private updateDelay: number | undefined;
    private status: MapStatus;


    constructor() {
        this.createControl();
        this.storeStatus();
    }


    createControl(): void {
        $("<div>", { class: "iitcontainer bottom statusbar" }).append(
            $("<span>", { class: "iitcbaredge bottomleft" }),
            $("<div>", { id: "mapstatus", class: "iitcbars bottom" }).append(
                $("<div>", { class: "progress loaded" }),
                $("<div>", { class: "progress loaderror" }),
                $("<span>", { class: "zoomdetails" })
            )
        ).appendTo($("body"));
    }


    updateDelayed = (status?: Partial<MapStatus>): void => {
        this.storeStatus(status);

        if (!this.updateDelay) {
            this.updateDelay = window.setTimeout(() => {
                this.updateDelay = undefined;
                this.update()
            }, 0);
        }
    }


    update(status?: Partial<MapStatus>): void {
        this.storeStatus(status);

        this.updateZoomDetails();
        this.updateProgressbar();

        // compatibility call
        if (globalThis.renderUpdateStatus) globalThis.renderUpdateStatus();
    }


    private storeStatus(status?: Partial<MapStatus>): void {
        if (!status) {
            this.status = {
                total: 100,
                done: 100,
                failed: 0
            };
            return;
        }

        this.status.total = status.total ?? this.status.total;
        this.status.done = Math.min(this.status.total, status.done ?? this.status.done);
        this.status.failed = Math.min(this.status.total, status.failed ?? this.status.failed);
    }


    private updateZoomDetails(): void {
        const details = this.getZoomDetails();
        $("#mapstatus .zoomdetails").text(details);
    }


    getZoomDetails(): string {
        const tileParameters = this.getDataZoomTileParameters();

        if (tileParameters.hasPortals) {
            return "all portals";
        }

        if (tileParameters.minLinkLength === 0) {
            return "all links";
        }

        if (tileParameters.minLinkLength > 1000) {
            return `>${tileParameters.minLinkLength / 1000}km`
        } else {
            return `>${tileParameters.minLinkLength}m`;
        }
    }


    private getDataZoomTileParameters(): TileParameters {
        const zoom = window.map.getZoom();
        const dataZoom = getDataZoomForMapZoom(zoom);
        return getMapZoomTileParameters(dataZoom);
    }


    private updateProgressbar(): void {

        const maxWidth = 100;

        const allTiles = this.status.total;
        const pending = allTiles - this.status.done;

        const failed = this.status.failed;


        let loadbarWidth = pending / allTiles * maxWidth;
        const errorCtrl = $("#mapstatus .progress.loaderror");
        if (failed > 0) {
            loadbarWidth -= 50;
            errorCtrl.width(50);
            errorCtrl.text(`${failed} failed`);
            errorCtrl.tooltip({ content: `${failed} of ${allTiles} failed to load` });
            errorCtrl.show();
        } else {
            errorCtrl.hide();
        }


        const loadCtrl = $("#mapstatus .progress.loaded");
        if (pending > 0) {
            loadCtrl.width(loadbarWidth);
            loadCtrl.show();
        } else {
            loadCtrl.hide();
        }
    }
}

export const mapStatus = new MapStatusBar();
