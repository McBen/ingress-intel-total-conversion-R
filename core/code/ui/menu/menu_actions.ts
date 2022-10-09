import { PasscodeDialog } from "../dialogs/passcode";
import { SearchDialog } from "../dialogs/search";
import { IITCMenu } from "./menu";
import { GLOPT, IITCOptions } from "../../helper/options";


export const initializeMenu = (iitcmenu: IITCMenu): void => {

    iitcmenu.addEntry({ name: "View\\Search", onClick: () => { new SearchDialog(); } });
    iitcmenu.addEntry({ name: "View\\Region Score", onClick: () => showRegionScore() });
    iitcmenu.addEntry({ name: "Layer" });
    iitcmenu.addEntry({ name: "Command\\Passcode", onClick: () => { new PasscodeDialog(); } });
    iitcmenu.addEntry({ name: "Draw\\DrawTools Options" }); // TODO: Draw
    iitcmenu.addEntry({ name: "Misc" });

    iitcmenu.addEntry({ name: "View\\Go to current location", onClick: () => { window.map.locate({ setView: true, maxZoom: 13 }); return; } });
    iitcmenu.addEntry({
        name: "View\\Show Zoom-Buttons",
        onClick: () => {
            const old = IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true);
            IITCOptions.set(GLOPT.SHOW_ZOOM_BUTTONS, !old);
            updateZoomButtons();
        },
        hasCheckbox: true,
        isChecked: () => IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true)
    });

    iitcmenu.addEntry({ name: "?\\About", onClick: () => aboutIITC() });


    const migratePlugins = new Map<string, string>([
        ["About IITC", ""],
        ["Permalink", ""],
        ["Region scores", ""],
        ["Missions in view", "View\\Missions in view"]
    ]);

    const groupLayers = {
        "Level": ["Level 1 Portals", "Level 2 Portals", "Level 3 Portals", "Level 4 Portals",
            "Level 5 Portals", "Level 6 Portals", "Level 7 Portals", "Level 8 Portals"],
        "Faction": ["Unclaimed/Placeholder Portals", "Resistance", "Enlightened"],
        "Ornaments": ["Artifacts", "Beacons", "Frackers",
            "Ornament: Anomaly Portals", "Ornament: Battle Beacons",
            "Ornament: Battle Results", "Ornament: Scout Controller"],
        "Player Tracker": ["Player Tracker Resistance", "Player Tracker Enlightened"]
    };

    setTimeout(() => {
        iitcmenu.migrateToolbox(migratePlugins);
        iitcmenu.migrateLayers(groupLayers);
        iitcmenu.migrateHighlighters();

        $("#portal_highlight_select").hide();
    }, 200);

    $("#toolbox").hide();
    $(".leaflet-control-layers").hide();
    $("#portal_highlight_select").hide();

    updateZoomButtons();
}


export const showRegionScore = (): void => {
    window.RegionScoreboard.showDialog();
}


const updateZoomButtons = (): void => {
    $(".leaflet-control-zoom").toggle(IITCOptions.getSafe(GLOPT.SHOW_ZOOM_BUTTONS, true));
}
