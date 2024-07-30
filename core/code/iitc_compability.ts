/* eslint-disable no-underscore-dangle */

// Export functions for old IITC-Plugins
import { alert, dialog, DIALOGS } from "./ui/dialog";
import { idle, IdleResumeCallback } from "./map/idle";
import * as CalcTools from "./map/map_data_calc_tools";
import * as utils from "./helper/utils_misc";
import * as times from "./helper/times";
import * as L from "leaflet";

import { Log, LogApp } from "./helper/log_apps";
import { postAjax } from "./helper/send_request";
import { IITCr } from "./IITC";
import { PortalInfoDetailed } from "./portal/portal_info_detailed";
import { fixPortalImageUrl, renderPortalDetails } from "./portal/portal_display";
import { createMarker, portalMarkerScale, setMarkerStyle } from "./map/portal_marker";
import { getPortalFields, getPortalFieldsCount, getPortalLinks, getPortalLinksCount } from "./helper/portal_data";
import { portalDetail } from "./portal/portal_details_get";
import { Highlighter } from "./portal/highlighters";
import { selectPortalByLatLng } from "./map/url_paramater";
import { migrateNames } from "./ui/menu/menu_actions";
import { current as currentChat } from "./ui/log/logwindow";
const log = Log(LogApp.Plugins);


const NOOP = () => { /* */ };

// DIALOG
(globalThis as any).alert = alert as any;
(globalThis as any).dialog = dialog;
(globalThis as any).DIALOGS = DIALOGS;


// IDLE
(globalThis as any).isIdle = () => idle.isIdle();
(globalThis as any).idleReset = () => idle.reset();
(globalThis as any).idleSet = () => idle.set();
(globalThis as any).addResumeFunction = (fct: IdleResumeCallback) => idle.addResumeFunction(fct);


// MAP_DATA_CALC_TOOLS
(globalThis as any).setupDataTileParams = CalcTools.setupDataTileParameters;
(globalThis as any).getMapZoomTileParameters = CalcTools.getMapZoomTileParameters;
(globalThis as any).getDataZoomTileParameters = CalcTools.getDataZoomTileParameters;
(globalThis as any).getDataZoomForMapZoom = CalcTools.getDataZoomForMapZoom;
(globalThis as any).lngToTile = CalcTools.lngToTile;
(globalThis as any).latToTile = CalcTools.latToTile;
(globalThis as any).tileToLng = CalcTools.tileToLng;
(globalThis as any).tileToLat = CalcTools.tileToLat;
(globalThis as any).pointToTileId = CalcTools.pointToTileId;

// PortalMarker
(globalThis as any).portalMarkerScale = portalMarkerScale;
(globalThis as any).createMarker = createMarker;
(globalThis as any).setMarkerStyle = setMarkerStyle;

// Portal_Data
(globalThis as any).getPortalLinks = getPortalLinks;
(globalThis as any).getPortalFields = getPortalFields;
(globalThis as any).getPortalFieldsCount = getPortalFieldsCount;
(globalThis as any).getPortalLinksCount = getPortalLinksCount;


// Request
(globalThis as any).postAjax = postAjax;
// (globalThis as any).mapDataRequest .. init below

// Render
// (globalThis as any).Render .. init below
(globalThis as any).isLayerGroupDisplayed = (name: string, defaultState: boolean) => IITCr.layers.isLayerKnown(name) ? IITCr.layers.isLayerVisible(name) : defaultState;

// layerChooser
// (globalThis as any).layerChooser .. init below

/**
 * @deprecated even in IITC-CE it is deprecated
 */
(globalThis as any).addLayerGroup = (name: string, layerGroup: L.LayerGroup<any>, defaultDisplay: boolean): void => {
    IITCr.layers.addOverlay(name, layerGroup, { default: defaultDisplay });
};
/**
 * @deprecated even in IITC-CE it is deprecated
 */
(globalThis as any).removeLayerGroup = (layerGroup: L.LayerGroup<any>): void => {
    IITCr.layers.removeOverlay(layerGroup);
};

// Hooks
(globalThis as any).pluginCreateHook = NOOP; // stub
(globalThis as any).VALID_HOOKS = []; // stub
(globalThis as any).runHooks = IITCr.hooks.trigger.bind(IITCr.hooks);
(globalThis as any).addHook = IITCr.hooks.on.bind(IITCr.hooks);
(globalThis as any).removeHook = IITCr.hooks.off.bind(IITCr.hooks);

// portalDetails
(globalThis as any).getPortalRange = (d: PortalInfoDetailed) => { console.assert(d instanceof PortalInfoDetailed, "wrong type"); return d.getPortalRange(); };
(globalThis as any).getLinkAmpRangeBoost = (d: PortalInfoDetailed) => d.getLinkAmpRangeBoost();
(globalThis as any).getPortalLevel = (d: PortalInfoDetailed) => d.getPortalLevel();
(globalThis as any).getPortalModsByType = (d: PortalInfoDetailed, type: string) => d.getPortalModsByType(type);
(globalThis as any).getMaxOutgoingLinks = (d: PortalInfoDetailed) => d.getMaxOutgoingLinks();
(globalThis as any).PortalInfoDetailed = PortalInfoDetailed;

(globalThis as any).portalDetail = portalDetail;


// portalDetails Display
(globalThis as any).fixPortalImageUrl = fixPortalImageUrl;
(globalThis as any).renderPortalDetails = renderPortalDetails;

(globalThis as any).renderUpdateStatus = NOOP; // stub

// highlighter
type HighLighterFct = (data: { portal: IITC.Portal }) => void;
interface HighLighterNew {
    highlight: HighLighterFct;
    setSelected?: (activate: boolean) => void;
}

(globalThis as any).addPortalHighlighter = (name: string, hl: HighLighterFct | HighLighterNew) => {

    if ((hl as HighLighterNew).highlight) {
        const highlight: Highlighter = {
            name,
            // @ts-ignore
            highlight: (p: IITC.Portal) => (hl as HighLighterNew).highlight.call(hl, { portal: p }),
            // @ts-ignore
            setSelected: (hl as HighLighterNew).setSelected.bind(hl)
        };
        IITCr.highlighter.add(highlight);
    } else {
        const fct = hl as HighLighterFct;
        IITCr.highlighter.add({
            name,
            highlight: (p: IITC.Portal) => fct({ portal: p })
        });
    }
};


/** @deprecated
(globalThis as any).escapeJavascriptString = (str: string): string => {
    return (str + "").replace(/[\\"']/g, "\\$&");
}
*/

// utils
(globalThis as any).makePermalink = utils.makePermalink;
(globalThis as any).clampLatLngBounds = utils.clampLatLngBounds;
(globalThis as any).clampLatLng = utils.clampLatLng;
(globalThis as any).genFourColumnTable = utils.genFourColumnTable;
(globalThis as any).uniqueArray = utils.uniqueArray;
(globalThis as any).prettyEnergy = utils.prettyEnergy;
(globalThis as any).escapeHtmlSpecialChars = utils.escapeHtmlSpecialChars;
(globalThis as any).convertTextToTableMagic = utils.convertTextToTableMagic;
(globalThis as any).scrollBottom = utils.scrollBottom;
(globalThis as any).writeCookie = utils.writeCookie;
(globalThis as any).eraseCookie = utils.eraseCookie;
(globalThis as any).digits = utils.digits;
(globalThis as any).zeroPad = times.zeroPad;
(globalThis as any).unixTimeToString = times.unixTimeToString;
(globalThis as any).unixTimeToDateTimeString = times.unixTimeToDateTimeString;
(globalThis as any).unixTimeToHHmm = times.unixTimeToHHmm;
(globalThis as any).formatInterval = times.formatInterval;
(globalThis as any).showPortalPosLinks = utils.showPortalPosLinks;
(globalThis as any).isTouchDevice = utils.isTouchDevice;
(globalThis as any).getURLParam = utils.getURLParam;
(globalThis as any).readCookie = utils.readCookie;
(globalThis as any).selectPortalByLatLng = selectPortalByLatLng;
(globalThis as any).zoomToAndShowPortal = utils.zoomToAndShowPortal;

(globalThis as any).iitcCompabilityInit = () => {
    // these variables are only available after boot
    (globalThis as any).mapDataRequest = IITCr.mapDataRequest;
    (globalThis as any).Render = {
        // @ts-ignore
        prototype: IITCr.mapDataRequest.getRender() // used in Drone Helper
    };
    // @ts-ignore
    (globalThis as any).layerChooser = {
        addOverlay: (layer: L.Layer, name: string, options = {}) => IITCr.layers.addOverlay(name, layer, options),
        removeLayer: (layer: L.Layer, _options = {}) => IITCr.layers.removeOverlay(layer),

        addBaseLayer: (layer: L.Layer, name: string) => IITCr.layers.addBase(name, layer)
    };

    // Artifacts
    (globalThis as any).artifact = {
        requestData: IITCr.artifacts.requestData.bind(IITCr.artifacts),
        getArtifactEntities: IITCr.artifacts.getArtifactEntities.bind(IITCr.artifacts),
        handleFailure: IITCr.artifacts.handleFailure.bind(IITCr.artifacts),
        processData: IITCr.artifacts.processData.bind(IITCr.artifacts)
    };
}

globalThis.chat = {
    postMsg: NOOP,
    backgroundChannelData: NOOP,
    getActive: () => { return "all" },
    request: () => currentChat().request(false)
};

// IITC-CE v.0.38.0
interface IITC_ButtonOptions {
    id?: string;
    label: string;
    action: () => void;
}

(globalThis as any).IITC = {
    toolbox: {

        /**
         * Adds a button to the toolbox.
         *
         * @param {ButtonArgs} buttonArgs - The arguments for the button.
         * @returns {string|null} The ID of the added button or null if required parameters are missing.
         */
        addButton: (buttonOptions: IITC_ButtonOptions): string | undefined => {

            const name = migrateNames().get(buttonOptions.label) || "misc\\" + buttonOptions.label;

            const entry = IITCr.menu.addEntry({
                id: buttonOptions.id,
                name,
                onClick: buttonOptions.action
            });

            return entry.id;
        },

        /**
         * Updates an existing button in the toolbox.
         * @returns True if the button is successfully updated, false otherwise.
         */
        updateButton: (_buttonId: string, _buttonOptions: Partial<IITC_ButtonOptions>): boolean => {
            return false;
        },

        /**
         * Removes a button from the toolbox.
         *
         * @returns True if the button is successfully removed, false otherwise.
         */
        removeButton: (buttonId: string): boolean => {
            const known = IITCr.menu.hasEntry(buttonId);
            IITCr.menu.removeEntry(buttonId);
            return known;
        }
    }
}




log.info("IITC Compabiltiy layer loaded");
