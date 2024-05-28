import { idle } from "../map/idle";
import { dialog } from "../ui/dialog";
import { readCookie } from "./utils_misc";
import { SECONDS } from "./times";

/**
 *  chat refresh every 30s (base time)
 *  (intel has 2min refresh)
 */
const REFRESH = 30 * SECONDS;

/**
 * limit on refresh time since previous refresh, limiting repeated move refresh rate
 */
const MINIMUM_OVERRIDE_REFRESH = 10 * SECONDS;

/**
 *  add 5 seconds per zoom level
 */
const ZOOM_LEVEL_ADJ = 5 * SECONDS;

/**
 * refresh time to use after a movement event
 */
export const ON_MOVE_REFRESH = 2.5 * SECONDS;

/**
 * don't request anymore data
 * used if intel answers with out-of-date error (long time idle)
 */
let blockOutOfDateRequests: boolean | undefined;

/**
 * posts AJAX request to Ingress API.
 * action: last part of the actual URL, the rpc/dashboard. is
 *         added automatically
 * data: JSON data to post. method will be derived automatically from
 *       action, but may be overridden. Expects to be given Hash.
 *       Strings are not supported.
 * success: method to call on success. See jQuery API docs for avail-
 *          able arguments: http://api.jquery.com/jQuery.ajax/
 * error: see above. Additionally it is logged if the request failed.
 */

export const postAjax = (action: string, data: any,
    successCallback: (data: any, status: any, xhr: JQuery.jqXHR) => void,
    errorCallback?: (xhr: JQuery.jqXHR | null, textStatus: any | undefined, errorText: string) => void): void => {


    const onError = (jqXHR: JQuery.jqXHR, textStatus, errorThrown: string) => {
        requests.remove(jqXHR);

        // pass through to the user error func, if one exists
        if (errorCallback) {
            errorCallback(jqXHR, textStatus, errorThrown);
        }
    };

    const onSuccess = (data, textStatus, jqXHR: JQuery.jqXHR) => {
        requests.remove(jqXHR);

        // the Niantic server can return a HTTP success, but the JSON response contains an error. handle that sensibly
        if (data && data.error && data.error === "out of date") {
            // let's call the error callback in thos case...
            if (errorCallback) {
                errorCallback(jqXHR, textStatus, "data.error == 'out of date'");
            }

            outOfDateUserPrompt();
        } else {
            successCallback(data, textStatus, jqXHR);
        }
    };

    // we set this flag when we want to block all requests due to having an out of date CURRENT_VERSION
    if (blockOutOfDateRequests) {

        // call the error callback, if one exists
        if (errorCallback) {
            // NOTE: error called on a setTimeout - as it won't be expected to be synchronous
            // ensures no recursion issues if the error handler immediately resends the request
            setTimeout(() => errorCallback(null, undefined, "window.blockOutOfDateRequests is set"), 10);
        }
        return;
    }

    const versionStr = niantic_params.CURRENT_VERSION;
    const post_data = JSON.stringify($.extend({}, data, { v: versionStr }));

    const result = $.ajax({
        url: "/r/" + action,
        type: "POST",
        data: post_data,
        context: data,
        dataType: "json",
        success: [onSuccess],
        error: [onError],
        contentType: "application/json; charset=utf-8",
        beforeSend: request => {
            request.setRequestHeader("X-CSRFToken", readCookie("csrftoken"));
        }
    });

    requests.add(result);
}


const outOfDateUserPrompt = () => {
    // we block all requests while the dialog is open.
    if (!blockOutOfDateRequests) {
        blockOutOfDateRequests = true;

        dialog({
            title: "Reload IITC",
            html: "<p>IITC is using an outdated version code. This will happen when Niantic updates the standard intel site.</p>"
                + "<p>You need to reload the page to get the updated changes.</p>"
                + "<p>If you have just reloaded the page, then an old version of the standard site script is cached somewhere."
                + "In this case, try clearing your cache, or waiting 15-30 minutes for the stale data to expire.</p>",
            buttons: {
                "RELOAD": () => {
                    /* TODO: on mobile
                    if (window.isApp && app.reloadIITC) {
                        app.reloadIITC();
                    } else {*/
                    window.location.reload();
                }
            },
            closeCallback: () => {
                blockOutOfDateRequests = undefined;
            }
        });
    }
}


/**
 * TODO: check: only used for chat ?
 */
export class RequestQueue {

    private activeRequests: JQuery.jqXHR[] = [];
    private onRefreshFunctions: (() => void)[] = []
    private refreshTimeout: number | undefined;
    private lastRefreshTime: number = 0;


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


    /**
     * sets the timer for the next auto refresh. Ensures only one timeout
     * is queued. May be given 'override' in milliseconds if time should
     * not be guessed automatically. Especially useful if a little delay
     * is required, for example when zooming.
     */
    startRefreshTimeout(override: number) {

        if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
        if (override === -1) return;  // don't set a new timeout

        let t = 0;
        if (override) {
            t = override;

            // ensure override can't cause too fast a refresh if repeatedly used (e.g. lots of scrolling/zooming)
            let timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
            if (timeSinceLastRefresh < 0) timeSinceLastRefresh = 0;  // in case of clock adjustments
            if (timeSinceLastRefresh < MINIMUM_OVERRIDE_REFRESH) {
                t = (MINIMUM_OVERRIDE_REFRESH - timeSinceLastRefresh);
            }
        } else {
            t = REFRESH;

            const adj = ZOOM_LEVEL_ADJ * (18 - window.map.getZoom());
            if (adj > 0) t += adj;
        }

        this.refreshTimeout = window.setTimeout(() => this.callOnRefreshFunctions(), t);
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
