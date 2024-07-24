import { render } from "solid-js/web";
import { LogWindow, LogSetPage, setTabs, current } from "./log/logwindow";
import { LogRequest } from "./log/logrequest";
import { requests } from "../helper/send_request";
import { GLOPT, IITCOptions } from "../helper/options";

const Default_Location: DOMRect = new DOMRect(0, 0, 705, 350);


export const setupLogWindow = () => {
    const logwindow = $("<div>", { id: "logwindow" });
    $("body").append(logwindow);
    render(() => <LogWindow />, logwindow[0]);

    $("#logwindow").resizable({
        distance: 5,
        handles: { ne: ".scalebutton" },
        resize: (event: any) => console.log(event)
    });

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


type Location = { x: number, y: number, width: number, height: number };
const initLocation = () => {
    const stored = IITCOptions.get<Location>(GLOPT.CHAT_LOCATION);
    if (stored) {
        const loc = new DOMRect(stored.x, stored.y, stored.width, stored.height);
        setLogLocation(loc);
    } else {
        const y = $("#logwindow").parent().height() - Default_Location.height;
        const loc = new DOMRect(Default_Location.x, y, Default_Location.width, Default_Location.height);
        setLogLocation(loc);
    }
}

export const getLogLocation = (): DOMRect => {
    const chat = document.getElementById("logwindow");
    console.assert(chat, "chat is lost");
    if (!chat) return Default_Location;

    return chat.getBoundingClientRect();
}

export const setLogLocation = (loc: DOMRect) => {
    /*const chat = document.getElementById("logwindow");
    console.assert(chat, "chat is lost");
    if (!chat) return;

    chat.style.left = loc.x + "px";
    chat.style.top = loc.y + "px";
    chat.style.width = loc.width + "px";
    chat.style.height = loc.height + "px";

    const store: Location = {
        x: loc.x,
        y: loc.y,
        width: loc.width,
        height: loc.height
    }
    IITCOptions.set(GLOPT.CHAT_LOCATION, store);
    */

    $("#logwindow").position({ my: "left bottom", at: "left bottom-30" });
}
