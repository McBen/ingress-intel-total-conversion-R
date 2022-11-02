import "ulog";
import anylogger from "anylogger";

export enum LogApp {
    Plugins = "Plugins",
    Map = "Map",
    Idle = "Idle",
    Dialog = "Dialog",
    Events = "Events",
    Score = "Score",
}

export const Log = (type: LogApp) => anylogger(type);
