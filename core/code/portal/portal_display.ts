import { FACTION, FACTION_CSS } from "../constants";
import { hooks } from "../helper/hooks";
import { makePermalink, showPortalPosLinks } from "../utils_misc";
import { portalDetail } from "./portal_details_get";
import { getPortalMiscDetails, getResonatorDetails, getModDetails } from "./portal_display_helper"
import { teamStr2Faction } from "./portal_info";
import { PortalInfoDetailed } from "./portal_info_detailed";
import { selectPortal } from "../map/portal_select";

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
        renderPortalFullDetails(guid, details);
    } else {
        const portal = window.portals[guid];
        renderLowDetails(portal);
    }
}


const renderLowDetails = (portal: IITC.Portal): void => {

    const pdata = portal.options.data;
    const title = (pdata && pdata.title) || "...";
    const location = L.latLng(pdata.latE6 * 1e-6, pdata.lngE6 * 1e-6);
    const team = teamStr2Faction(pdata.team as IITC.EntityTeam);
    const level = team === FACTION.none ? 0 : pdata.level;

    renderDetailTemplate({
        guid: portal.options.guid,
        team,
        title,
        location,
        img: pdata.image,
        level,
        levelDetail: `Level ${level}`,
        others: [
            $("<div>", { id: "portalStatus", text: "Loading details..." }),
            $("<div>", { class: "linkdetails" })
        ]
    });

}


const renderPortalFullDetails = (guid: PortalGUID, details: PortalInfoDetailed): void => {

    const modDetails = getModDetails(details);
    const miscDetails = getPortalMiscDetails(guid, details);
    const resoDetails = getResonatorDetails(details);
    const historyDetails = getPortalHistoryDetails(details);

    const level = details.team === FACTION.none ? 0 : details.level;

    renderDetailTemplate({
        guid,
        team: details.team,
        title: details.title,
        location: details.getLocation(),
        img: details.image,
        level,
        levelDetail: getLevelDetails(level, details),
        others: [
            modDetails,
            miscDetails,
            resoDetails,
            $("<div>", { class: "linkdetails" }),
            historyDetails
        ]
    });

    hooks.trigger("portalDetailsUpdated", { guid, portal: window.portals[guid], portalDetails: details, portalData: details.getPortalSummaryData() });
}


interface TemplateDetails {
    team: FACTION,
    title: string,
    guid: PortalGUID,
    location: L.LatLng,
    img: string,
    level: number,
    levelDetail: string,
    others: (string | JQuery)[]
}

const renderDetailTemplate = (options: TemplateDetails): void => {

    $("#portaldetails")
        .html("") // to ensure it's clear
        .attr("class", FACTION_CSS[options.team])
        .append(
            $("<h3>", { class: "title" })
                .text(options.title)
                .prepend(
                    $('<svg><use xlink:href="#ic_place_24px"/><title>Click to move to portal</title></svg>')
                        .attr({
                            class: "material-icons icon-button",
                            style: "float: left"
                        })
                        .on("click", () => {
                            zoomToAndShowPortal(options.guid, options.location);
                            if (isSmartphone()) { show("map"); }
                        })),

            $("<span>").attr({
                class: "close",
                title: "Close [w]",
                accesskey: "w"
            }).text("X")
                .on("click", () => {
                    renderPortalDetails();
                    if (isSmartphone()) { show("map"); }
                }),

            $("<div>")
                .attr({
                    class: "imgpreview",
                    title: options.title + "\n\nClick to show full image.",
                    style: 'background-image: url("' + fixPortalImageUrl(options.img) + '")'
                })
                .append(
                    $("<span>", { id: "level", title: options.levelDetail, text: options.level }),
                    $("<img>", { class: "hide", src: options.img })
                ),

            ...options.others
        );

    renderPortalUrl(options.location.lat, options.location.lng, options.title);
}


const getLevelDetails = (levelInt: number, details?: PortalInfoDetailed): string => {

    if (!details) return `Level ${levelInt}`;

    const levelDetails = details.getPortalLevel();
    if (levelDetails === 8) return "Level 8\nfully upgraded";

    const missRes = levelDetails === Math.ceil(levelDetails) ? 8
        : (Math.ceil(levelDetails) - levelDetails) * 8;

    return `Level ${levelInt}\n${missRes} resonator level(s) needed for next portal level`;
}


const getPortalHistoryDetails = (d: PortalInfoDetailed): string => {
    if (!d.history) {
        return '<div id="historydetails" class="missing">History missing</div>';
    }

    const classParts = {};
    ["visited", "captured", "scoutControlled"].forEach(k => {
        classParts[k] = d.history[k] ? 'class="completed"' : "";
    });

    return L.Util.template('<div id="historydetails">History: '
        + '<span id="visited" {visited}>visited</span> | '
        + '<span id="captured" {captured}>captured</span> | '
        + '<span id="scout-controlled" {scoutControlled}>scout controlled</span>'
        + "</div>", classParts);
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
