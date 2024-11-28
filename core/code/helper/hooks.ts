import * as ChatParser from "./chatparser";
import { Log, LogApp } from "../helper/log_apps";
const log = Log(LogApp.Events);


/**
 *  Plugins may listen to any number of events by specifying the name of
 *  the event to listen to and handing a function that should be exe-
 *  cuted when an event occurs. Callbacks will receive additional data
 *  the event created as their first parameter. The value is always a
 *  hash that contains more details.
 *
 *  For example, this line will listen for portals to be added and print
 *  the data generated by the event to the console:
 *  window.addHook('portalAdded', function(data) { log.log(data) });
 *
 *  Boot hook: booting is handled differently because IITC may not yet
 *             be available. Have a look at the plugins in plugins/. All
 *             code before “// PLUGIN START” and after “// PLUGIN END” is
 *             required to successfully boot the plugin.
 *
 *  Here’s more specific information about each event:
 *  portalSelected: called when portal on map is selected/unselected.
 *               Provide guid of selected and unselected portal.
 *  mapDataRefreshStart: called when we start refreshing map data
 *  mapDataEntityInject: called just as we start to render data. has callback to
 *                       Sinject cached entities into the map render
 *  mapDataRefreshEnd: called when we complete the map data load
 *  portalAdded: called when a portal has been received and is about to
 *               be added to its layer group. Note that this does NOT
 *               mean it is already visible or will be, shortly after.
 *               If a portal is added to a hidden layer it may never be
 *               shown at all. Injection point is in
 *               code/map_data.js#renderPortal near the end. Will hand
 *               the Leaflet CircleMarker for the portal in "portal" var.
 *  linkAdded:   called when a link is about to be added to the map
 *  fieldAdded:  called when a field is about to be added to the map
 *  portalRemoved: called when a portal has been removed
 *  linkRemoved: called when a link has been removed
 *  fieldRemoved: called when a field has been removed
 *  portalDetailsUpdated: fired after the details in the sidebar have
 *               been (re-)rendered Provides data about the portal that
 *               has been selected.
 *  publicChatDataAvailable: this hook runs after data for any of the
 *               public chats has been received and processed, but not
 *               yet been displayed. The data hash contains both the un-
 *               processed raw ajax response as well as the processed
 *               chat data that is going to be used for display.
 *  factionChatDataAvailable: this hook runs after data for the faction
 *               chat has been received and processed, but not yet been
 *               displayed. The data hash contains both the unprocessed
 *               raw ajax response as well as the processed chat data
 *               that is going to be used for display.
 *  alertsChatDataAvailable: this hook runs after data for the alerts
 *               chat has been received and processed, but not yet been
 *               displayed. The data hash contains both the unprocessed
 *               raw ajax response as well as the processed chat data
 *               that is going to be used for display.
 *  requestFinished: DEPRECATED: best to use mapDataRefreshEnd instead
 *               called after each map data request finished. Argument is
 *               {success: boolean} indicated the request success or fail.
 *  iitcLoaded: called after IITC and all plugins loaded
 *  portalDetailLoaded: called when a request to load full portal detail
 *               completes. guid, success, details parameters
 *  paneChanged  called when the current pane has changed. On desktop,
 *               this only selects the current chat pane; on mobile, it
 *               also switches between map, info and other panes defined
 *               by plugins
 *  artifactsUpdated: called when the set of artifacts (including targets)
 *               has changed. Parameters names are old, new.
 *  nicknameClicked:
 *  geoSearch:
 *  search:
 */

type HookCallback = (data: any) => boolean | void;


export class Hooks {

    private hooks: { [index: string]: HookCallback[] } = {};
    private isRunning: number;

    public chat = {
        on: ChatParser.on,
        off: ChatParser.off
    };

    constructor() {
        this.hooks = {};
        this.isRunning = 0;
    }

    trigger(event: string, data: any): boolean {
        if (!this.hooks[event]) { return true; }

        this.isRunning++;
        const interrupted = this.hooks[event].every(callback => {
            if (callback(data) === false) {
                return false;
            } else {
                return true;
            }
        });

        this.isRunning--;
        return !interrupted;
    }


    on(event: "portalSelected", callback: (data: EventPortalSelected) => void, priority?: boolean): void;
    on(event: "publicChatDataAvailable", callback: (data: EventPublicChatDataAvailable) => void, priority?: boolean): void;
    on(event: "factionChatDataAvailable", callback: (data: EventFactionChatDataAvailable) => void, priority?: boolean): void;
    on(event: "portalDetailsUpdated", callback: (data: EventPortalDetailsUpdated) => void, priority?: boolean): void;
    on(event: "artifactsUpdated", callback: (data: EventArtifactsUpdated) => void, priority?: boolean): void;
    on(event: "mapDataRefreshStart", callback: (data: EventMapDataRefreshStart) => void, priority?: boolean): void;
    on(event: "mapDataEntityInject", callback: (data: EventMapDataEntityInject) => void, priority?: boolean): void;
    on(event: "mapDataRefreshEnd", callback: (data: EventMapDataRefreshEnd) => void, priority?: boolean): void;
    on(event: "portalAdded", callback: (data: EventPortalAdded) => void, priority?: boolean): void;
    on(event: "linkAdded", callback: (data: EventLinkAdded) => void, priority?: boolean): void;
    on(event: "fieldAdded", callback: (data: EventFieldAdded) => void, priority?: boolean): void;
    on(event: "portalRemoved", callback: (data: EventPortalRemoved) => void, priority?: boolean): void;
    on(event: "linkRemoved", callback: (data: EventLinkRemoved) => void, priority?: boolean): void;
    on(event: "fieldRemoved", callback: (data: EventFieldRemoved) => void, priority?: boolean): void;
    on(event: "requestFinished", callback: (data: EventRequestFinished) => void, priority?: boolean): void;
    on(event: "nicknameClicked", callback: (data: EventNicknameClicked) => boolean, priority?: boolean): void;
    on(event: "search", callback: (data: EventSearch) => void, priority?: boolean): void;
    on(event: "iitcLoaded", callback: () => void, priority?: boolean): void;
    on(event: "portalDetailLoaded", callback: (data: EventPortalDetailLoaded) => void, priority?: boolean): void;
    on(event: "paneChanged", callback: (data: EventPaneChanged) => void, priority?: boolean): void;
    on(event: string, callback: HookCallback, priority?: boolean): void;

    on(event: string, callback: HookCallback, priority: boolean = false) {
        if (this.hooks[event]) {
            if (priority) {
                this.hooks[event].splice(0, 0, callback);
            } else {
                this.hooks[event].push(callback);
            }
        } else {
            this.hooks[event] = [callback];
        }
    }

    // callback must the SAME function to be unregistered.
    off(event: string, callback: HookCallback) {
        let listeners = this.hooks[event];
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index === -1) {
                log.warn("Callback wasn't registered for this event.");
            } else {
                if (this.isRunning) {
                    listeners[index] = () => {/* noop */ };
                    this.hooks[event] = listeners = listeners.slice();
                }
                listeners.splice(index, 1);
            }
        }
    }
}


type EventPortalSelected = { selectedPortalGuid: string, unselectedPortalGuid: string };

export type EventPublicChatDataAvailable = { raw: any, result: Intel.ChatLine[], processed: any };
export type EventFactionChatDataAvailable = { raw: any, result: Intel.ChatLine[], processed: any };
export type EventPortalDetailsUpdated = { guid: string, portal: IITC.Portal, portalDetails: any /* class portalDetail */, portalData: IITC.PortalData };
export type EventArtifactsUpdated = { old: any, new: any };
export type EventMapDataRefreshStart = { bounds: L.LatLngBounds, mapZoom: number, dataZoom: number, minPortalLevel: number, tileBounds: L.LatLngBounds };
export type EventMapDataEntityInject = { callback: (ents: any, details: DecodePortalDetails) => void }; // TODO: ents = portalDetailLoaded.ent
export type EventMapDataRefreshEnd = unknown;
export type EventPortalAdded = { portal: IITC.Portal, previousData: IITC.PortalData };
export type EventLinkAdded = { link: IITC.Link };
export type EventFieldAdded = { field: IITC.Field };
export type EventPortalRemoved = { portal: IITC.Portal, data: IITC.PortalData };
export type EventLinkRemoved = { link: IITC.Link, data: IITC.LinkData };
export type EventFieldRemoved = { field: IITC.Field, data: IITC.FieldData };
export type EventRequestFinished = { success: boolean };
export type EventNicknameClicked = { event: MouseEvent, nickname: string };
export type EventSearch = any; /* class search.Query */
export type EventPaneChanged = string;

type PortalDetailEnt = [guid: string, timestamp: number, portal: any /* Intel.PortalDetails */];
type EventPortalDetailLoaded =
    { guid: string, success: true, details: IITC.PortalDataDetail, ent: PortalDetailEnt }
    | { guid: string, success: false, details: never, ent: never };


export const hooks = new Hooks();