/* eslint-disable no-underscore-dangle */

// Export functions for old IITC-Plugins
import { alert, dialog } from "./ui/dialog";
import { idle, IdleResumeCallback } from "./map/idle";
import * as CalcTools from "./map/map_data_calc_tools";
import * as Hooks from "./helper/hooks";

import { Log, LogApp } from "./helper/log_apps";
import { postAjax } from "./helper/send_request";
import { IITC } from "./IITC";
const log = Log(LogApp.Plugins);


const NOOP = () => { /* */ };

// DIALOG
globalThis.alert = alert as any;
globalThis.dialog = dialog;


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

// Request
globalThis.postAjax = postAjax;


// Hooks
globalThis.pluginCreateHook = NOOP; // stub
globalThis.VALID_HOOKS = []; // stub
globalThis.runHooks = IITC.hooks.trigger.bind(IITC.hooks);
globalThis.addHook = IITC.hooks.on.bind(IITC.hooks);
globalThis.removeHook = IITC.hooks.off.bind(IITC.hooks);


globalThis.renderUpdateStatus = NOOP; // stub

log.info("IITC Compabiltiy layer loaded");
