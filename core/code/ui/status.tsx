import { render } from "solid-js/web";
import { getDataZoomForMapZoom, getMapZoomTileParameters, TileParameters } from "../map/map_data_calc_tools";

export interface MapStatus {
    total: number;
    done: number;
    failed: number;
}

const EdgeBottomLeft = () => {
    return <span class="iitcbaredge bottomleft"></span>
}

const MapStatsBar = () => {
    return <div id="mapstatus" class="iitcbar bottom">
        <div class="progress loaded"></div>
        <div class="progress loaderror"></div>
        <span class="zoomdetails"></span>
    </div>

}

const StatusBar = () => {
    return <div class="iitcontainer statusbar">
        <EdgeBottomLeft></EdgeBottomLeft>
        <MapStatsBar></MapStatsBar>
    </div>;
}



export class MapStatusBar {

    private status: MapStatus;

    constructor() {
        this.createControl();
        this.storeStatus();
    }


    createControl(): void {
        render(() => <StatusBar />, document.body);
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


    private getZoomDetails(): string {
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
