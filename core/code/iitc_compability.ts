// Export functions for old IITC-Plugins
import { alert, dialog } from "./ui/dialog";
import anylogger from "anylogger"

const log = anylogger("iitc_compabiltiy");

globalThis.alert = alert as any;
globalThis.dialog = dialog;


log.info("IITC Compabiltiy layer loaded");
