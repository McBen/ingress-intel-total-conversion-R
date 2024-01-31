import { FACTION, FACTION_CSS } from "../constants";
import { hooks } from "../helper/hooks";
import { makePermalink, showPortalPosLinks } from "../helper/utils_misc";
import { portalDetail } from "./portal_details_get";
import { getPortalMiscDetails, getResonatorDetails, getModDetails } from "./portal_display_helper"
import { PortalInfo, teamStr2Faction } from "./portal_info";
import { PortalInfoDetailed } from "./portal_info_detailed";
import { selectPortal } from "../map/portal_select";
import { setPortalDetails } from "../ui/sidebar";

const DEFAULT_PORTAL_IMG = "//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png";


let lastVisible: PortalGUID | undefined;

const resetScrollOnNewPortal = () => {
    if (selectedPortal !== lastVisible) {
        // another portal selected so scroll position become irrelevant to new portal details
        $("#sidebar").scrollTop(0); // NB: this works ONLY when #sidebar:visible
        lastVisible = selectedPortal;
    }
}


// to be ovewritten in app.js
const renderPortalUrl = (lat: number, lng: number, title: string) => {
    const linkDetails = $(".linkdetails");

    // a permalink for the portal
    const permaHtml = $("<a>").attr({
        href: makePermalink(L.latLng(lat, lng)),
        title: "Create a URL link to this portal"
    }
    ).text("Portal link");
    linkDetails.append($("<aside>").append(permaHtml));

    // and a map link popup dialog
    const mapHtml = $("<a>", {
        title: "Link to alternative maps (Google, etc)",
        text: "Map links"
    }).on("click", () => showPortalPosLinks(lat, lng, title));
    linkDetails.append($("<aside>").append(mapHtml));
};


export const renderPortalDetails = (guid?: PortalGUID) => {
    selectPortal(window.portals[guid] ? guid : null);
    if ($("#sidebar").is(":visible")) {
        resetScrollOnNewPortal();
        lastVisible = guid;
    }

    if (guid && !portalDetail.isFresh(guid)) {
        void portalDetail.request(guid);
    }


    if (!window.portals[guid]) {
        urlPortal = guid;
        $("#portaldetails").html("");
        if (isSmartphone()) {
            $(".fullimg").remove();
            $("#mobileinfo").html('<div style="text-align: center"><b>tap here for info screen</b></div>');
        }
        return;
    }

    const details = portalDetail.get(guid);
    if (details) {
        setPortalDetails(details);

    } else {
        // const portal = window.portals[guid];
        // const info = new PortalInfo(portal,)
        // setPortalDetails(details);
    }
}

export const fixPortalImageUrl = (url: string): string => {
    if (url) {
        if (window.location.protocol === "https:") {
            url = url.replace(/^http:\/\//, "//");
        }
        return url;
    } else {
        return DEFAULT_PORTAL_IMG;
    }
}
