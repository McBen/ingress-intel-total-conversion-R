import { render } from "solid-js/web";
import { LogWindow, setTabs } from "./log/logwindow";
import { LogRequest } from "./log/logrequest";


export const setupLogWindow = () => {
    const logwindow = $("<div>", { id: "logwindow" });
    $("body").append(logwindow);
    render(() => <LogWindow />, logwindow[0]);


    setTabs([
        new LogRequest("all"),
        new LogRequest("faction"),
        new LogRequest("alerts"),
    ]);
}
