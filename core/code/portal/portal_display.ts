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

    const portal = window.portals[guid];
    const details = portalDetail.get(guid);

    // fallback if no details is loaded
    // TODO: use PortalInfo ?
    let data = {
        level: portal.options.data.level,
        title: portal.options.data.title,
        image: portal.options.data.image,
        resCount: portal.options.data.resCount,
        latE6: portal.options.data.latE6,
        lngE6: portal.options.data.lngE6,
        health: portal.options.data.health,
        team: teamStr2Faction(portal.options.data.team as IITC.EntityTeam)
    }

    if (details) {
        data = details.getPortalSummaryData();
    }

    const modDetails = details ? '<div class="mods">' + getModDetails(details) + "</div>" : "";
    const miscDetails = details ? getPortalMiscDetails(guid, details) : "";
    const resoDetails = details ? getResonatorDetails(details) : "";
    const statusDetails = details ? "" : '<div id="portalStatus">Loading details...</div>';
    const historyDetails = getPortalHistoryDetails(details);

    const img = fixPortalImageUrl(details ? details.image : data.image);
    const title = (details && details.title) || (data && data.title) || "null";

    const lat = data.latE6 * 1e-6;
    const lng = data.lngE6 * 1e-6;

    const imgTitle = title + "\n\nClick to show full image.";

    const levelInt = data.team === FACTION.none ? 0 : data.level;
    const levelDetails = getLevelDetails(levelInt, details);


    $("#portaldetails")
        .html("") // to ensure it's clear
        .attr("class", FACTION_CSS[data.team])
        .append(
            $("<h3>", { class: "title" })
                .text(title)
                .prepend(
                    $('<svg><use xlink:href="#ic_place_24px"/><title>Click to move to portal</title></svg>')
                        .attr({
                            class: "material-icons icon-button",
                            style: "float: left"
                        })
                        .on("click", () => {
                            zoomToAndShowPortal(guid, L.latLng(data.latE6 * 1e-6, data.lngE6 + 1e-6));
                            if (isSmartphone()) { show("map"); }
                        })),

            $("<span>").attr({
                class: "close",
                title: "Close [w]",
                accesskey: "w"
            }).text("X")
                .on("click", () => {
                    renderPortalDetails(null);
                    if (isSmartphone()) { show("map"); }
                }),

            // help cursor via ".imgpreview img"
            $("<div>")
                .attr({
                    class: "imgpreview",
                    title: imgTitle,
                    style: 'background-image: url("' + img + '")'
                })
                .append(
                    $("<span>", { id: "level", title: levelDetails, text: levelInt }),
                    $("<img>", { class: "hide", src: img })
                ),

            modDetails,
            miscDetails,
            resoDetails,
            statusDetails,
            $("<div>", { class: "linkdetails" }),
            historyDetails
        );

    renderPortalUrl(lat, lng, title);

    // only run the hooks when we have a portalDetails object - most plugins rely on the extended data
    // TODO? another hook to call always, for any plugins that can work with less data?
    if (details) {
        hooks.trigger("portalDetailsUpdated", { guid, portal, portalDetails: details, portalData: data });
    }
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

    var classParts = {};
    ["visited", "captured", "scoutControlled"].forEach(function (k) {
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
