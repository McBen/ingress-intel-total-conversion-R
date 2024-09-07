import { hooks } from "../helper/hooks";
import { portalDetail } from "../portal/portal_details_get";
import { setMarkerStyle } from "./portal_marker";

// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
const ACCESS_INDICATOR_COLOR = "orange";
const RANGE_INDICATOR_COLOR = "red";
const HACK_RANGE = 40; // in meters, max. distance from portal to be able to access it


export let portalRangeIndicator: L.GeodesicCircle | L.Circle | undefined;
let portalAccessIndicator: L.Circle | undefined;
/**
 * draws link-range and hack-range circles around the portal with the
 * given details. Clear them if parameter 'd' is null.
 */
export const setPortalIndicators = (p?: IITC.Portal) => {

    if (portalRangeIndicator) window.map.removeLayer(portalRangeIndicator);
    portalRangeIndicator = undefined;
    if (portalAccessIndicator) window.map.removeLayer(portalAccessIndicator);
    portalAccessIndicator = undefined;

    // if we have a portal...

    if (p) {
        const coord = p.getLatLng();

        // range is only known for sure if we have portal details
        const d = portalDetail.get(p.options.guid);
        if (d) {
            const range = d.getPortalRange();
            portalRangeIndicator = (range.range > 0
                ? L.geodesicCircle(coord, range.range, {
                    fill: false,
                    color: RANGE_INDICATOR_COLOR,
                    weight: 3,
                    dashArray: range.isLinkable ? undefined : "10,10",
                    interactive: false
                })
                : L.circle(coord, { radius: range.range, fill: false, stroke: false, interactive: false })
            ).addTo(window.map);
        }

        portalAccessIndicator = L.circle(coord,
            { radius: HACK_RANGE, fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, interactive: false }
        ).addTo(window.map);
    }

}

/**
 * highlights portal with given GUID. Automatically clears highlights
 * on old selection. Returns false if the selected portal changed.
 * Returns true if it's still the same portal that just needs an
 * update.
 */
export const selectPortal = (guid?: PortalGUID) => {
    const update = selectedPortal === guid;
    const oldPortalGuid = selectedPortal;
    selectedPortal = guid;

    const oldPortal = oldPortalGuid && window.portals[oldPortalGuid];
    const newPortal = guid && window.portals[guid];

    // Restore style of unselected portal
    if (!update && oldPortal) setMarkerStyle(oldPortal, false);

    // Change style of selected portal
    if (newPortal) {
        setMarkerStyle(newPortal, true);

        if (window.map.hasLayer(newPortal)) {
            newPortal.bringToFront();
        }
    }

    setPortalIndicators(newPortal ? newPortal : undefined);

    hooks.trigger("portalSelected", { selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid });
    return update;
}
