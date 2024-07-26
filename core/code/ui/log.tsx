import { render } from "solid-js/web";
import { LogWindow, LogSetPage, setTabs, current } from "./log/logwindow";
import { LogRequest } from "./log/logrequest";
import { requests } from "../helper/send_request";
import { GLOPT, IITCOptions } from "../helper/options";


type Size = { width: number, height: number };
const DefaultSize: Size = { width: 705, height: 350 };


export const setupLogWindow = () => {
    const logwindow = $("<div>", { id: "logwindow" });
    $("body").append(logwindow);
    render(() => <LogWindow />, logwindow[0]);

    initResize();
    initLocation();


    const tabs = [
        new LogRequest("all", "All"),
        new LogRequest("faction", "Faction"),
        new LogRequest("alerts", "Alerts"),
    ];

    setTabs(tabs);
    setTimeout(() => LogSetPage(tabs[0]), 500); // delay before init request

    requests.addRefreshFunction(() => current().request(false));
}

const initResize = () => {
    $("#logwindow").resizable({
        distance: 5,
        handles: { ne: ".scalebutton" },
        stop: (_event: any, ui: JQueryUI.ResizableUIParams) => storeSize(ui.size)
    });
};

0

const initLocation = () => {
    const stored = IITCOptions.getSafe(GLOPT.CHAT_LOCATION, DefaultSize);
    $("#logwindow").width(stored.width);
    $("#logwindow").height(stored.height);
}

const storeSize = (size: Size) => {
    $("#logwindow").css("top", ""); // "Resizeable" sets TOP, but we use BOTTOM
    IITCOptions.set(GLOPT.CHAT_LOCATION, size);
}
