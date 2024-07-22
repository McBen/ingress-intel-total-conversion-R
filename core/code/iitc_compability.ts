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
const log = Log(LogApp.Plugins);


const NOOP = () => { /* */ };

// DIALOG
globalThis.alert = alert as any;
globalThis.dialog = dialog;
globalThis.DIALOGS = DIALOGS;


// IDLE
globalThis.isIdle = () => idle.isIdle();
globalThis.idleReset = () => idle.reset();
globalThis.idleSet = () => idle.set();
globalThis.addResumeFunction = (fct: IdleResumeCallback) => idle.addResumeFunction(fct);


// MAP_DATA_CALC_TOOLS
globalThis.setupDataTileParams = CalcTools.setupDataTileParameters;
globalThis.getMapZoomTileParameters = CalcTools.getMapZoomTileParameters;
globalThis.getDataZoomTileParameters = CalcTools.getDataZoomTileParameters;
globalThis.getDataZoomForMapZoom = CalcTools.getDataZoomForMapZoom;
globalThis.lngToTile = CalcTools.lngToTile;
globalThis.latToTile = CalcTools.latToTile;
globalThis.tileToLng = CalcTools.tileToLng;
globalThis.tileToLat = CalcTools.tileToLat;
globalThis.pointToTileId = CalcTools.pointToTileId;

// PortalMarker
globalThis.portalMarkerScale = portalMarkerScale;
globalThis.createMarker = createMarker;
globalThis.setMarkerStyle = setMarkerStyle;

// Portal_Data
globalThis.getPortalLinks = getPortalLinks;
globalThis.getPortalFields = getPortalFields;
globalThis.getPortalFieldsCount = getPortalFieldsCount;
globalThis.getPortalLinksCount = getPortalLinksCount;


// Request
globalThis.postAjax = postAjax;
// globalThis.mapDataRequest .. init below

// Render
// globalThis.Render .. init below
globalThis.isLayerGroupDisplayed = (name: string, defaultState: boolean) => IITCr.layers.isLayerKnown(name) ? IITCr.layers.isLayerVisible(name) : defaultState;

// layerChooser
// globalThis.layerChooser .. init below

/**
 * @deprecated even in IITC-CE it is deprecated
 */
globalThis.addLayerGroup = (name: string, layerGroup: L.LayerGroup<any>, defaultDisplay: boolean): void => {
    IITCr.layers.addOverlay(name, layerGroup, { default: defaultDisplay });
};
/**
 * @deprecated even in IITC-CE it is deprecated
 */
globalThis.removeLayerGroup = (layerGroup: L.LayerGroup<any>): void => {
    IITCr.layers.removeOverlay(layerGroup);
};

// Hooks
globalThis.pluginCreateHook = NOOP; // stub
globalThis.VALID_HOOKS = []; // stub
globalThis.runHooks = IITCr.hooks.trigger.bind(IITCr.hooks);
globalThis.addHook = IITCr.hooks.on.bind(IITCr.hooks);
globalThis.removeHook = IITCr.hooks.off.bind(IITCr.hooks);

// portalDetails
globalThis.getPortalRange = (d: PortalInfoDetailed) => { console.assert(d instanceof PortalInfoDetailed, "wrong type"); return d.getPortalRange(); };
globalThis.getLinkAmpRangeBoost = (d: PortalInfoDetailed) => d.getLinkAmpRangeBoost();
globalThis.getPortalLevel = (d: PortalInfoDetailed) => d.getPortalLevel();
globalThis.getPortalModsByType = (d: PortalInfoDetailed, type: string) => d.getPortalModsByType(type);
globalThis.getMaxOutgoingLinks = (d: PortalInfoDetailed) => d.getMaxOutgoingLinks();
globalThis.PortalInfoDetailed = PortalInfoDetailed;

globalThis.portalDetail = portalDetail;


// portalDetails Display
globalThis.fixPortalImageUrl = fixPortalImageUrl;
globalThis.renderPortalDetails = renderPortalDetails;

globalThis.renderUpdateStatus = NOOP; // stub

// highlighter
type HighLighterFct = (data: { portal: IITC.Portal }) => void;
interface HighLighterNew {
    highlight: HighLighterFct;
    setSelected?: (activate: boolean) => void;
}

globalThis.addPortalHighlighter = (name: string, hl: HighLighterFct | HighLighterNew) => {

    if ((hl as HighLighterNew).highlight) {
        const highlight: Highlighter = {
            name,
            highlight: (p: IITC.Portal) => (hl as HighLighterNew).highlight.call(hl, { portal: p }),
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
globalThis.escapeJavascriptString = (str: string): string => {
    return (str + "").replace(/[\\"']/g, "\\$&");
}
*/

// utils
globalThis.makePermalink = utils.makePermalink;
globalThis.clampLatLngBounds = utils.clampLatLngBounds;
globalThis.clampLatLng = utils.clampLatLng;
globalThis.genFourColumnTable = utils.genFourColumnTable;
globalThis.uniqueArray = utils.uniqueArray;
globalThis.prettyEnergy = utils.prettyEnergy;
globalThis.escapeHtmlSpecialChars = utils.escapeHtmlSpecialChars;
globalThis.convertTextToTableMagic = utils.convertTextToTableMagic;
globalThis.scrollBottom = utils.scrollBottom;
globalThis.writeCookie = utils.writeCookie;
globalThis.eraseCookie = utils.eraseCookie;
globalThis.digits = utils.digits;
globalThis.zeroPad = times.zeroPad;
globalThis.unixTimeToString = times.unixTimeToString;
globalThis.unixTimeToDateTimeString = times.unixTimeToDateTimeString;
globalThis.unixTimeToHHmm = times.unixTimeToHHmm;
globalThis.formatInterval = times.formatInterval;
globalThis.showPortalPosLinks = utils.showPortalPosLinks;
globalThis.isTouchDevice = utils.isTouchDevice;
globalThis.getURLParam = utils.getURLParam;
globalThis.readCookie = utils.readCookie;
globalThis.selectPortalByLatLng = selectPortalByLatLng;
globalThis.zoomToAndShowPortal = utils.zoomToAndShowPortal;

globalThis.iitcCompabilityInit = () => {
    // these variables are only available after boot
    globalThis.mapDataRequest = IITCr.mapDataRequest;
    globalThis.Render = {
        prototype: IITCr.mapDataRequest.getRender() // used in Drone Helper
    }

    globalThis.layerChooser = {
        addOverlay: (layer: L.Layer, name: string, options = {}) => IITCr.layers.addOverlay(name, layer, options),
        removeLayer: (layer: L.Layer, _options = {}) => IITCr.layers.removeOverlay(layer),

        addBaseLayer: (layer: L.Layer, name: string) => IITCr.layers.addBase(name, layer)
    }

    // Artifacts
    globalThis.artifact = {
        requestData: IITCr.artifacts.requestData.bind(IITCr.artifacts),
        getArtifactEntities: IITCr.artifacts.getArtifactEntities.bind(IITCr.artifacts),
        handleFailure: IITCr.artifacts.handleFailure.bind(IITCr.artifacts),
        processData: IITCr.artifacts.processData.bind(IITCr.artifacts)
    }
}


// IITC-CE v.0.38.0
interface IITC_ButtonOptions {
    id?: string;
    label: string;
    action: () => void;
}

globalThis.IITC = {
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
