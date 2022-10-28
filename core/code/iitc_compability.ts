/* eslint-disable no-underscore-dangle */

// Export functions for old IITC-Plugins
import { alert, dialog } from "./ui/dialog";
import { idle, IdleResumeCallback } from "./map/idle";
import * as CalcTools from "./map/map_data_calc_tools";
import * as Hooks from "./helper/hooks";

import { Log, LogApp } from "./helper/log_apps";
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

// Hooks
globalThis.pluginCreateHook = NOOP; // stub
globalThis.VALID_HOOKS = []; // stub
globalThis._hooks = Hooks.hooks;
globalThis.runHooks = Hooks.runHooks;
globalThis.addHook = Hooks.addHook;
globalThis.removeHook = Hooks.removeHook;


globalThis.renderUpdateStatus = NOOP; // stub

log.info("IITC Compabiltiy layer loaded");
