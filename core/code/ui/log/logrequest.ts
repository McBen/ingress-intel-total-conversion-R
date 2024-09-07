// TODO: move outside of UI
import { clampLatLngBounds } from "../../helper/utils_misc";
import { Log, LogApp } from "../../helper/log_apps";
import { postAjax } from "../../helper/send_request";
import { hooks } from "../../helper/hooks";
import { current, setLines } from "./logwindow";
const log = Log(LogApp.Chat);

/**
 * to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box
 * is not considered different
 */
const BOUNDINGBOX_SAME_FACTOR = 0.1;

type Channels = "all" | "faction" | "alerts";
interface ChatRequestData {
    minLatE6: number;
    minLngE6: number;
    maxLatE6: number;
    maxLngE6: number;
    minTimestampMs: number;
    maxTimestampMs: number;
    tab: Channels;
    plextContinuationGuid?: string;
    ascendingTimestampOrder?: boolean;
};


export class LogRequest {

    private oldBounds: L.LatLngBounds;
    private channel: Channels;
    private data: Intel.ChatLine[];
    private requestRunning: boolean;
    readonly title: string;

    constructor(channel: Channels, title?: string) {
        this.channel = channel;
        this.title = title || channel;
        this.clear();
    }


    request(getOldMessages: boolean, isRetry = false) {
        if (this.requestRunning && !isRetry) return;

        this.requestRunning = true;

        const post = this.createPostData(getOldMessages);
        postAjax(
            'getPlexts',
            post,
            (data) => this.processNewLogData(data, !!post.ascendingTimestampOrder),
            () => {
                isRetry
                    ? () => { this.requestRunning = false; }
                    : () => { this.requestRunning = false; this.request(getOldMessages, true) }
            }
        );
    }


    /**
     * @param getOldMessages true => get previous messages (scroll up)
     *          false => get newer messages (scroll down)
     */
    private createPostData(getOldMessages: boolean): ChatRequestData {
        const bounds = this.getMapBounds();

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const postData: ChatRequestData = {
            minLatE6: Math.round(sw.lat * 1E6),
            minLngE6: Math.round(sw.lng * 1E6),
            maxLatE6: Math.round(ne.lat * 1E6),
            maxLngE6: Math.round(ne.lng * 1E6),
            minTimestampMs: -1,
            maxTimestampMs: -1,
            tab: this.channel
        }

        if (getOldMessages) {
            const message = this.data[0];
            if (message) {
                postData.plextContinuationGuid = message[0];
                postData.maxTimestampMs = message[1];
            }
        } else {
            const message = this.data.at(-1);
            if (message) {
                postData.plextContinuationGuid = message[0];
                postData.minTimestampMs = message[1];
                postData.ascendingTimestampOrder = true;
            }
        }

        return postData;
    }


    private getMapBounds(): L.LatLngBounds {
        const bounds = clampLatLngBounds(window.map.getBounds());

        if (this.oldBounds && (bounds.pad(BOUNDINGBOX_SAME_FACTOR).contains(this.oldBounds) ||
            this.oldBounds.pad(BOUNDINGBOX_SAME_FACTOR).contains(bounds))) {
            return this.oldBounds;
        }

        log.debug(`Bounding Box changed, chat will be cleared (old: ${this.oldBounds && this.oldBounds.toBBoxString()}; new: ${bounds.toBBoxString()})`);

        this.clear();

        this.oldBounds = bounds;
        return bounds;
    }

    clear() {
        this.data = [];
    }



    processNewLogData(data: Intel.ChatCallback, isSortedAscending: boolean) {
        this.requestRunning = false;

        if (!data || !data.result) {
            return log.warn(`${this.channel} chat error. Waiting for next auto-refresh.`);
        }

        if (data.result.length > 0) {
            this.mergeData(data.result, isSortedAscending);
        }


        // trigger updates
        switch (this.channel) {
            case "all":
                hooks.trigger('publicChatDataAvailable', { raw: data, result: data.result, processed: this.data });
                break;
            case "faction":
                hooks.trigger('factionChatDataAvailable', { raw: data, result: data.result, processed: this.data });
                break;
            case "alerts":
                hooks.trigger('alertChatDataAvailable', { raw: data, result: data.result, processed: this.data });
                break;
        }

        // update view
        if (data.result.length > 0 && current() === this) {
            setLines(this.data);
        }
    }


    //window.chat.writeDataToHash = function (newData, storageHash, isPublicChannel, isOlderMsgs, isAscendingOrder) {
    mergeData(data: Intel.ChatLine[], isSortedAscending: boolean) {

        const filter = data.filter(line => !this.data.some(c => c[0] === line[0]));

        // filter duplicated lines
        if (filter.length !== data.length) {
            const dups = data.length - filter.length;
            if (dups > 1) { // there should be only 1 duplicated (the start/end)
                log.warn(`receiving duplicate chat lines (count: ${data.length} dup: ${data.length - filter.length})`);
            }
        }

        if (filter.length === 0) return;

        if (!isSortedAscending) {
            filter.reverse();
        }

        if (data.length > 0 && filter.at(-1)![1] <= data[0][1]) {
            this.data = data.concat(this.data);
        } else {
            this.data = this.data.concat(data);
        }

        // DEBUG-START
        if (this.data.every((a, index) => index === 0 || this.data[index - 1][1] <= a[1])) {
            log.error("chat lines are not sorted");
        }
        // DEBUG-END

        // note: array should already be sorted; just to be sure
        this.data.sort((a, b) => a[1] - b[1]);
    }
}

