import { hooks } from "../helper/hooks";
import { portalDetail } from "./portal_details_get";
import { selectPortal } from "../map/portal_select";
import { setPortalDetails } from "../ui/portal/sidebar";

const DEFAULT_PORTAL_IMG = "//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png";


let lastVisible: PortalGUID | undefined;

const resetScrollOnNewPortal = () => {
    if (selectedPortal !== lastVisible) {
        // another portal selected so scroll position become irrelevant to new portal details
        $("#sidebar").scrollTop(0); // NB: this works ONLY when #sidebar:visible
        lastVisible = selectedPortal;
    }
}



export const renderPortalDetails = (guid?: PortalGUID) => {
    selectPortal(window.portals[guid] ? guid : undefined);
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
        hooks.trigger("portalDetailsUpdated", { guid, portal: window.portals[guid], portalDetails: details, portalData: details.getPortalSummaryData() });
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
