import { dialog } from "./ui/dialog";
import anylogger from "anylogger"
import { ScriptInfo } from "types";

const log = anylogger("dialog_about");

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
        + '  <a href="' + "@url_homepage@" + '" target="_blank">IITC Homepage</a> |' // TODO Add URL
        + '  <a href="' + "@url_tg@" + '" target="_blank">Telegram channel</a><br />' // TODO Add URL
        + "   On the script’s homepage you can:"
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

    const pluginsInfo: ScriptInfo[] = (window.bootPlugins as any).info;

    const extra = getIITCVersionAddition();

    const plugins = pluginsInfo.map(convertPluginInfo)
        .sort((a, b) => a.name > b.name ? 1 : -1)
        .map(p => pluginInfoToString(p, extra))
        .join("\n");

    return plugins;
}

type PluginInfo = {
    build: string;
    name: string;
    date: string;
    error: string | undefined;
    version: string | undefined;
    description: string | undefined;
}

const convertPluginInfo = (info: ScriptInfo, index: number): PluginInfo => {
    // Plugins metadata come from 2 sources:
    // - buildName, pluginId, dateTimeVersion: inserted in plugin body by build script
    //   (only standard plugins)
    // - script.name/version/description: from GM_info object, passed to wrapper
    //   `script` may be not available if userscript manager does not provede GM_info
    //   (atm: IITC-Mobile for iOS)
    const result: PluginInfo = {
        build: info.buildName,
        name: info.pluginId,
        date: info.dateTimeVersion,
        error: info.error,
        version: undefined,
        description: undefined
    };

    const script = info.script;
    if (script) {
        if (typeof script.name === "string") {
            result.name = script.name.replace(/^IITC[\s-]+plugin:\s+/i, ""); // cut non-informative name part
        }
        result.version = script.version;
        result.description = script.description;
    }

    if (!result.name) {
        if (script_info.script) { // check if GM_info is available
            result.name = `[unknown plugin: index ${index}]`;
            result.description = "this plugin does not have proper wrapper; report to it's author";
        } else { // userscript manager fault
            result.name = `[3rd-party plugin: index ${index}]`;
        }
    }

    return result;
}

const pluginInfoToString = (p: PluginInfo, extra?: string): string => {
    let classname = "";
    let description = p.description || "";
    const name = p.name;
    const verinfo = formatVersionInfo(p, extra);

    if (isStandardPlugin(p)) {
        classname += "plugin-is-standard";
    }

    if (p.error) {
        classname += " plugin-error";
        description = p.error;
    }

    return `<li class="${classname}" title="${description}">${name}${verinfo}</li>`;
}


const isStandardPlugin = (plugin): boolean => {
    return (plugin.build === script_info.buildName && plugin.date === script_info.dateTimeVersion);
}



const getIITCVersion = (): string => {
    const iitc = script_info;
    const version = (iitc.script && iitc.script.version || iitc.dateTimeVersion);
    return `${version} [${iitc.buildName}]`;
}


const getIITCVersionAddition = (): string | undefined => {
    const extra = script_info.script && script_info.script.version.match(/^\d+\.\d+\.\d+(\..+)$/);
    return extra && extra[1];
}


const formatVersionInfo = (p: PluginInfo, extra?: string): string => {
    if (p.version && extra) {
        const cutPos = p.version.length - extra.length;
        // cut extra version component (timestamp) if it is equal to main script's one
        if (p.version.substring(cutPos) === extra) {
            p.version = p.version.substring(0, cutPos);
        }
    }

    p.version = p.version || p.date;
    if (p.version) {
        const tooltip = [];
        if (p.build) { tooltip.push("[" + p.build + "]"); }
        if (p.date && p.date !== p.version) { tooltip.push(p.date); }

        const title = tooltip[0] ? ' title="' + tooltip.join(" ") + '"' : "";

        return ` - <code${title}>${p.version}</code>`;
    }

    return "";
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
