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
import { IITC } from "./IITC";
import { PortalInfoDetailed } from "./portal/portal_info_detailed";
import { fixPortalImageUrl, renderPortalDetails } from "./portal/portal_display";
import { createMarker, portalMarkerScale, setMarkerStyle } from "./map/portal_marker";
import { getPortalFields, getPortalFieldsCount, getPortalLinks } from "./helper/portal_data";
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

// Request
globalThis.postAjax = postAjax;
// globalThis.mapDataRequest .. init below

// Render
// globalThis.Render .. init below
globalThis.isLayerGroupDisplayed = (name: string, defaultState: boolean) => IITC.layers.isLayerKnown(name) ? IITC.layers.isLayerVisible(name) : defaultState;

// layerChooser
// globalThis.layerChooser .. init below

/**
 * @deprecated even in IITC-CE it is deprecated
 */
globalThis.addLayerGroup = (name: string, layerGroup: L.LayerGroup<any>, defaultDisplay: boolean): void => {
    IITC.layers.addOverlay(name, layerGroup, { default: defaultDisplay });
};
/**
 * @deprecated even in IITC-CE it is deprecated
 */
globalThis.removeLayerGroup = (layerGroup: L.LayerGroup<any>): void => {
    IITC.layers.removeOverlay(layerGroup);
};

// Hooks
globalThis.pluginCreateHook = NOOP; // stub
globalThis.VALID_HOOKS = []; // stub
globalThis.runHooks = IITC.hooks.trigger.bind(IITC.hooks);
globalThis.addHook = IITC.hooks.on.bind(IITC.hooks);
globalThis.removeHook = IITC.hooks.off.bind(IITC.hooks);

// portalDetails
globalThis.getPortalRange = (d: PortalInfoDetailed) => { console.assert(d instanceof PortalInfoDetailed, "wrong type"); return d.getPortalRange(); };
globalThis.getLinkAmpRangeBoost = (d: PortalInfoDetailed) => d.getLinkAmpRangeBoost();
globalThis.getPortalLevel = (d: PortalInfoDetailed) => d.getPortalLevel();
globalThis.getPortalModsByType = (d: PortalInfoDetailed, type: string) => d.getPortalModsByType(type);
globalThis.getMaxOutgoingLinks = (d: PortalInfoDetailed) => d.getMaxOutgoingLinks();

// portalDetails Display
globalThis.fixPortalImageUrl = fixPortalImageUrl;
globalThis.renderPortalDetails = renderPortalDetails;

globalThis.renderUpdateStatus = NOOP; // stub

// highlighter
globalThis.addPortalHighlighter = (name: string, highlit: (data: any) => void) => {
    IITC.highlighter.add({ name, highlight: (p: IITC.Portal) => highlit({ data: p }) });
};


// utils
globalThis.makePermalink = utils.makePermalink;
globalThis.clampLatLngBounds = utils.clampLatLngBounds;
globalThis.clampLatLng = utils.clampLatLng;
globalThis.genFourColumnTable = utils.genFourColumnTable;
globalThis.uniqueArray = utils.uniqueArray;
globalThis.prettyEnergy = utils.prettyEnergy;
globalThis.escapeHtmlSpecialChars = utils.escapeHtmlSpecialChars;
globalThis.escapeJavascriptString = utils.escapeJavascriptString;
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

globalThis.iitcCompabilityInit = () => {
    // these variables are only available after boot
    globalThis.mapDataRequest = IITC.mapDataRequest;
    globalThis.Render = {
        prototype: IITC.mapDataRequest.getRender() // used in Drone Helper
    }

    globalThis.layerChooser = {
        addOverlay: (layer: L.Layer, name: string, options = {}) => IITC.layers.addOverlay(name, layer, options),
        removeLayer: (layer: L.Layer, _options = {}) => IITC.layers.removeOverlay(layer)
    }
}

log.info("IITC Compabiltiy layer loaded");
