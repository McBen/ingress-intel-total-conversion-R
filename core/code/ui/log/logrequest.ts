// TODO: move outside of UI
import { clampLatLngBounds } from "../../helper/utils_misc";
import { postAjax } from "../../helper/send_request";
import { hooks } from "../../helper/hooks";
import { current, setLines } from "./logwindow";
import { Log, LogApp } from "../../helper/log_apps";
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

    // TODO: DEBUG .. these shouldn't be needed
    private oldestLine: Intel.ChatLine | undefined;
    private newestLine: Intel.ChatLine | undefined;


    constructor(channel: Channels, title?: string) {
        this.channel = channel;
        this.title = title ?? channel;
        this.clear();
    }


    request(getOldMessages: boolean, isRetry = false) {
        log.debug("request")
        if (this.requestRunning && !isRetry) {
            log.debug("-> abort requestRunning")
            return;
        }

        this.requestRunning = true;

        const post = this.createPostData(getOldMessages);
        postAjax(
            'getPlexts',
            post,
            (data: Intel.ChatCallback) => this.processNewLogData(data, !!post.ascendingTimestampOrder, getOldMessages),
            () => {
                this.requestRunning = false;
                if (!isRetry) this.request(getOldMessages, true)
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
            minLatE6: Math.round(sw.lat * 1e6),
            minLngE6: Math.round(sw.lng * 1e6),
            maxLatE6: Math.round(ne.lat * 1e6),
            maxLngE6: Math.round(ne.lng * 1e6),
            minTimestampMs: -1,
            maxTimestampMs: -1,
            tab: this.channel
        }

        if (getOldMessages) {
            const messageShould = this.data[0];
            const message = this.oldestLine;

            if (message) {
                console.assert(message[0] === messageShould[0], "oldest differ")
                postData.plextContinuationGuid = message[0];
                postData.maxTimestampMs = message[1];
            }
        } else {
            const messageShould = this.data.at(-1);
            const message = this.newestLine;

            if (message) {
                console.assert(message[0] === messageShould![0], "newest differ", message, messageShould);
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

        log.debug(`Bounding Box changed, chat will be cleared (old: ${this.oldBounds?.toBBoxString()}; new: ${bounds.toBBoxString()})`);

        this.clear();

        this.oldBounds = bounds;
        return bounds;
    }

    clear() {
        this.data = [];
        this.oldestLine = undefined;
        this.newestLine = undefined;
    }



    processNewLogData(data: Intel.ChatCallback, isSortedAscending: boolean, oldData: boolean) {
        this.requestRunning = false;

        if (!data || !data.result) {
            return log.warn(`${this.channel} chat error. Waiting for next auto-refresh.`);
        }

        if (data.result.length > 0) {
            this.mergeData(data.result, isSortedAscending, oldData);
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
    mergeData(data: Intel.ChatLine[], isSortedAscending: boolean, oldData: boolean) {

        if (oldData) {
            console.assert(!isSortedAscending, "requesting old data should not be asc.sorted");
            this.oldestLine = isSortedAscending ? [...data[0]] : [...data.at(-1)!];
        } else {
            this.newestLine = isSortedAscending ? [...data.at(-1)!] : [...data[0]];
        }

        const filter = data.filter(line => !this.data.some(c => c[0] === line[0]));

        // filter duplicated lines
        if (filter.length !== data.length) {
            const dups = data.length - filter.length;
            if (dups > 0) {
                log.warn(`receiving duplicate chat lines (count: ${data.length} dup: ${data.length - filter.length})`);
            }
        }

        if (filter.length === 0) return;


        if (!isSortedAscending) {
            filter.reverse();
        }

        const is_previous_data = this.data.length > 0 && filter.at(-1)![1] <= data[0][1];
        console.assert(is_previous_data === oldData, "is old data but is not ?!?");
        this.data = is_previous_data ?
            [...filter, ...this.data] :
            [...this.data, ...filter];

        // DEBUG-START
        if (this.data.every((a, index) => index === 0 || this.data[index - 1][1] >= a[1])) {
            log.error("chat lines are not sorted");
        }
        // DEBUG-END

        // note: array should already be sorted; just to be sure
        this.data.sort((a, b) => a[1] - b[1]);
    }
}

