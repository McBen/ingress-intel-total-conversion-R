import { render } from "solid-js/web";
import { LogWindow, LogSetPage, setTabs, current } from "./log/logwindow";
import { LogRequest } from "./log/logrequest";
import { requests } from "../helper/send_request";


export const setupLogWindow = () => {
    const logwindow = $("<div>", { id: "logwindow" });
    $("body").append(logwindow);
    render(() => <LogWindow />, logwindow[0]);


    const tabs = [
        new LogRequest("all", "All"),
        new LogRequest("faction", "Faction"),
        new LogRequest("alerts", "Alerts"),
    ];

    setTabs(tabs);
    setTimeout(() => LogSetPage(tabs[0]), 500); // delay before init request

    requests.addRefreshFunction(() => current().request(false));
}
