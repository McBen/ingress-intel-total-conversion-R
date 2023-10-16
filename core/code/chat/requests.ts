import { idle } from "../map/idle";
import { MINIMUM_OVERRIDE_REFRESH, ZOOM_LEVEL_ADJ } from "../helper/send_request";
import { SECONDS } from "../helper/times";


/**
 * refresh time to use after a movement event
 */
export const ON_MOVE_REFRESH = 2.5 * SECONDS;


/**
 * to refresh chat
 */
export class RequestQueue {

    private activeRequests: JQuery.jqXHR[] = [];
    private onRefreshFunctions: (() => void)[] = [];
    private refreshTimeout: number | undefined;
    private lastRefreshTime: number = 0;


    /**
     * sets the timer for the next auto refresh. Ensures only one timeout
     * is queued. May be given 'override' in milliseconds if time should
     * not be guessed automatically. Especially useful if a little delay
     * is required, for example when zooming.
     */
    startRefreshTimeout(override: number) {

        if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
        if (override === -1) return; // don't set a new timeout

        let t = 0;
        if (override) {
            t = override;

            // ensure override can't cause too fast a refresh if repeatedly used (e.g. lots of scrolling/zooming)
            let timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
            if (timeSinceLastRefresh < 0) timeSinceLastRefresh = 0; // in case of clock adjustments
            if (timeSinceLastRefresh < MINIMUM_OVERRIDE_REFRESH) {
                t = (MINIMUM_OVERRIDE_REFRESH - timeSinceLastRefresh);
            }
        } else {
            t = REFRESH * 1000;

            const adj = ZOOM_LEVEL_ADJ * (18 - window.map.getZoom());
            if (adj > 0) t += adj;
        }

        this.refreshTimeout = window.setTimeout(() => this.callOnRefreshFunctions(), t);
    }

    add(ajax: JQuery.jqXHR): void {
        this.activeRequests.push(ajax);
    }

    remove(ajax: JQuery.jqXHR): void {
        const index = this.activeRequests.indexOf(ajax);
        this.activeRequests.splice(index, 1);
    }

    abort(): void {
        this.activeRequests.forEach(request => request.abort());

        this.activeRequests = [];
    }


    callOnRefreshFunctions() {
        this.startRefreshTimeout(0);

        if (idle.isIdle()) {
            return;
        }

        this.lastRefreshTime = Date.now();
        this.onRefreshFunctions.forEach(f => f());
    }


    /**
     *  add method here to be notified of auto-refreshes
     */
    addRefreshFunction(f: () => void): void {
        this.onRefreshFunctions.push(f);
    }
}

export const requests = new RequestQueue();
