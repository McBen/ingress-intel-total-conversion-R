import { PasscodeDialog } from "../dialogs/passcode";
import { SearchDialog } from "../dialogs/search/dialog";
import { IITCMenu } from "./menu";
import { GLOPT, IITCOptions } from "../../helper/options";
import { toast } from "../toast";
import { aboutIITC } from "../dialogs/about";
import { RegionScoreDialog } from "../dialogs/regionscore/dialog";
import { CacheDebug } from "../dialogs/debug/cache_hits";
import { IITC } from "../../IITC";
import { PluginDialog } from "../dialogs/plugins";


export const initializeMenu = (iitcmenu: IITCMenu): void => {

    setTimeout(() => {
        migrate(iitcmenu);
        $("#portal_highlight_select").hide();
    }, 200);

    $("#toolbox").hide();
    $(".leaflet-control-layers").hide();
    $("#portal_highlight_select").hide();

    updateZoomButtons();
}


export const setupMenu = (iitcmenu: IITCMenu): void => {
    iitcmenu.addEntry({ name: "Command" });
    iitcmenu.addEntry({ name: "View" });
    iitcmenu.addEntry({ name: "Layer" });
    iitcmenu.addEntry({ name: "Debug" });
    iitcmenu.addEntry({ name: "Misc" });

    iitcmenu.addEntry({ name: "Command\\Passcode", onClick: () => { new PasscodeDialog(); } });
    iitcmenu.addEntry({ name: "Command\\Search", onClick: () => { new SearchDialog(); } });
    iitcmenu.addEntry({ name: "Command\\Go to current location", onClick: panToLocation, isEnabled: isGettingLocation });
    iitcmenu.addEntry({ name: "Debug\\Tile cache", onClick: () => new CacheDebug(IITC.mapDataRequest.getCache()).show() });

    iitcmenu.addEntry({ name: "View\\Region Score", onClick: () => showRegionScore() });
    iitcmenu.addEntry({
        name: "View\\Show Zoom-Buttons",
        onClick: toogleZoomButtons,
        hasCheckbox: true,
        isChecked: () => IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true)
    });
    // iitcmenu.addSeparator("View");
    iitcmenu.addEntry({ name: "View\\Plugins", onClick: () => new PluginDialog().show() });

    iitcmenu.addEntry({ name: "?\\About", onClick: () => aboutIITC() });
}


export const migrate = (iitcmenu: IITCMenu): void => {

    const migratePlugins = new Map<string, string>([
        ["About IITC", ""],
        ["Permalink", ""],
        ["Region scores", ""],
        ["Missions in view", "View\\Missions in view"]
    ]);

    iitcmenu.migrateToolbox(migratePlugins);
}


const toogleZoomButtons = (): void => {
    const old = IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true);
    IITCOptions.set(GLOPT.SHOW_ZOOM_BUTTONS, !old);
    updateZoomButtons();
}


const updateZoomButtons = (): void => {
    $(".leaflet-control-zoom").toggle(IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true));
}

const showRegionScore = (): void => {
    RegionScoreDialog.showDialog();
}

let scanningLocation = false;
const panToLocation = (): void => {
    if (scanningLocation) return;

    window.map.locate({ setView: true, maxZoom: 13 });
    scanningLocation = true;

    window.map.on("locationerror", onLocationError);
    window.map.on("locationfound", onLocationFound);
}


const onLocationError = (): void => {
    toast("can't get location");
    scanningLocation = false;
}


const onLocationFound = (): void => {
    scanningLocation = false;
}


const isGettingLocation = (): boolean => {
    return !scanningLocation;
}

