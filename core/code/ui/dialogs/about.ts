import { dialog } from "../dialog";
import { IITC } from "../../IITC";
import { Plugin } from "../../plugin/plugins";

import { Log, LogApp } from "../../helper/log_apps";
const log = Log(LogApp.Dialog);


const Homepage = "https://github.com/McBen/ingress-intel-total-conversion-R/blob/master/README.md";

export const aboutIITC = (): void => {

    const html = createDialogContent();

    dialog({
        title: "IITC " + getIITCVersion(),
        id: "iitc-about",
        html,
        width: "auto",
        dialogClass: "ui-dialog-aboutIITC"
    });
};

const createDialogContent = (): string => {
    let html = ""
        + "<div><b>About IITC</b></div> "
        + "<div>Ingress Intel Total Conversion</div> "
        + "<hr>"
        + "<div>"
        + `  <a href="${Homepage}" target="_blank">IITC Homepage</a> |`
        + "   On the script's homepage you can:"
        + "   <ul>"
        + "     <li>Find Updates</li>"
        + "     <li>Get Plugins</li>"
        + "     <li>Report Bugs</li>"
        + "     <li>Contribute!</li>"
        + "   </ul>"
        + "</div>"
        + "<hr>"
        + "<div>Version: " + getIITCVersion() + "</div>";

    if (isShortOnLocalStorage()) {
        html += '<div class="warning">You are running low on LocalStorage memory.<br/>Please free some space to prevent data loss.</div>';
    }

    /*  TODO: Add me
       if (window.isApp && app.getVersionName) {
            html += '<div>IITC Mobile ' + app.getVersionName() + '</div>';
        }
        */

    const plugins = getPlugins();
    if (plugins) {
        html += "<div><p>Plugins:</p><ul>" + plugins + "</ul></div>";
    }

    return html;
};


const getPlugins = (): string => {

    const pluginNames = IITC.plugins.getListOfActivePlugins();
    const plugins = pluginNames.map(pname => {
        const plugin = IITC.plugins.getPlugin(pname);
        return pluginInfoToString(plugin!)
    });

    return plugins.join("\n");
}


const pluginInfoToString = (p: Plugin): string => {
    let classname = "";
    let description = p.description || "";
    const name = p.name;
    const verinfo = ` - <code>${p.version}</code>`;

    if (p.error) {
        classname += " plugin-error";
        description = p.error;
    }

    return `<li class="${classname}" title="${description}">${name}${verinfo}</li>`;
}


const getIITCVersion = (): string => {
    const iitc = script_info;
    const version = (iitc.script && iitc.script.version || iitc.dateTimeVersion);
    return `${version}`;
}


const isShortOnLocalStorage = (): boolean => {
    const MINIMUM_FREE_SPACE = 100000;
    try {
        localStorage.setItem("_MEM_CHECK_", "#".repeat(MINIMUM_FREE_SPACE));
    } catch (error) {
        log.error("out of localstorage space", error);
        return true;
    }

    localStorage.removeItem("_MEM_CHECK_");
    return false;
}
