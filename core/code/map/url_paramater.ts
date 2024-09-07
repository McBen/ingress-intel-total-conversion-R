import { getURLParam } from "../helper/utils_misc";
import { EventPortalAdded, hooks } from "../helper/hooks";
import * as L from "leaflet";
import { normLL } from "./map";
import { renderPortalDetails } from "../portal/portal_display";
import { DEFAULT_ZOOM } from "../constants";

export const readURLParamater = () => {

    const pll = getURLParam("pll");
    if (pll) {
        const pllSplit = pll.split(",");
        const ll = L.latLng(normLL(pllSplit[0], pllSplit[1]).center);
        selectPortalByLatLng(ll);
    }

    const urlPortal = getURLParam("pguid");
    if (urlPortal) autoSelectPortal(urlPortal);
};

export const autoSelectPortal = (guid: PortalGUID) => {
    if (!urlPortal) {
        hooks.on("portalAdded", urlPortalCallack);
    }
    urlPortal = guid;
};


let urlPortal: PortalGUID | undefined;
const urlPortalCallack = (data: any) => {
    if (data.portal.options.guid === urlPortal) {
        selectedPortal = urlPortal;
        urlPortal = undefined;
        hooks.off("portalAdded", urlPortalCallack);
    };
};


let urlPortalLL: L.LatLng | undefined;
export const selectPortalByLatLng = (ll: L.LatLng) => {
    // eslint-disable-next-line guard-for-in
    for (const guid in window.portals) {
        const latlng = window.portals[guid].getLatLng();
        if (latlng.equals(ll)) {
            renderPortalDetails(guid);
            return;
        }
    }

    urlPortalLL = ll;
    hooks.on("portalAdded", urlPortalLLCallack);
    window.map.setView(urlPortalLL, DEFAULT_ZOOM);
};

const urlPortalLLCallack = (data: EventPortalAdded) => {
    console.assert(urlPortalLL, "urlPortalLL not set");
    const ll = data.portal.getLatLng();
    if (ll.equals(urlPortalLL!)) {
        autoSelectPortal(data.portal.options.guid);
        urlPortalCallack(data);
        urlPortalLL = undefined;
        hooks.off("portalAdded", urlPortalLLCallack);
    };
};
