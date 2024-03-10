import { getURLParam } from "../helper/utils_misc";
import { hooks } from "../helper/hooks";
import * as L from "leaflet";
import { normLL } from "./map";

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
  urlPortal = guid;
  hooks.on("portalAdded", urlPortalCallack);
};


let urlPortal: PortalGUID | undefined;
const urlPortalCallack = data => {
  if (data.portal.options.guid === urlPortal) {
    selectedPortal = urlPortal;
    urlPortal = undefined;
    hooks.off("portalAdded", urlPortalCallack);
  };
};


let urlPortalLL: L.LatLng | undefined;
export const selectPortalByLatLng = (ll: L.LatLng) => {
  urlPortalLL = ll;
  hooks.on("portalAdded", urlPortalLLCallack);
};
/*
window.selectPortalByLatLng = function (lat, lng) {
    if (lng === undefined && lat instanceof Array) {
      lng = lat[1];
      lat = lat[0];
    } else if (lng === undefined && lat instanceof L.LatLng) {
      lng = lat.lng;
      lat = lat.lat;
    }
    for (var guid in window.portals) {
      var latlng = window.portals[guid].getLatLng();
      if (latlng.lat == lat && latlng.lng == lng) {
        renderPortalDetails(guid);
        return;
      }
    }
  
    // not currently visible
    urlPortalLL = [lat, lng];
    map.setView(urlPortalLL, DEFAULT_ZOOM);
  };
  
*/
const urlPortalLLCallack = data => {
  const ll = data.portal.getLatLng();
  if (ll.equal(urlPortalLL)) {
    autoSelectPortal(data.portal.options.guid);
    urlPortalCallack(data);
  };
};
