import { render } from "solid-js/web";
import { LogWindow } from "./log/logwindow";


export const setupLogWindow = () => {
    const logwindow = $("<div>", { id: "logwindow" });
    $("body").append(logwindow);
    render(() => <LogWindow />, logwindow[0]);
}
