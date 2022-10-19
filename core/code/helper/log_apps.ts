import "ulog";
import anylogger from "anylogger";

export enum LogApp {
    Plugins = "Plugins",
    Map = "Map",
    Idle = "Idle",
    Dialog = "Dialog"
}

export const Log = (type: LogApp) => anylogger(type);
