import { Plugin } from "./plugin_base";
import debounce from "debounce";
import { hooks } from "../helper/hooks";
import { SECONDS } from "../helper/times";
import * as CalcTools from "../map/map_data_calc_tools";
import { digits } from "../helper/utils_misc";
import * as AP from "../portal/portal_info_detailed";
import { FACTION } from "../constants";
import { IITCr } from "../IITC";

interface APs {
    AP: number;
    destroyPortals: number;
    capturePortals: number;
    finishPortals: number;
    destroyLinks: number;
    destroyFields: number;
};

export class APStats extends Plugin {
    public name = "Available AP statistics";
    public version = "1.0";
    public description = "Displays the per-team AP gains available in the current view";
    public author = "Hollow011";
    public tags: ["info", "ap", "portal", "info"];

    public defaultInactive = true;


    activate() {

        $("#sidebar").append(
            $("<div>", { id: "available_ap_display" }).css({ "color": "#ffce00", "font-size": "90%", "padding": "4px 2px" })
        );

        hooks.on("mapDataRefreshEnd", this.onMapDataRefreshEnd);
        hooks.on("requestFinished", this.onRequestFinished);

        this.update(false);
    }

    deactivate() {
        $("#sidebar #available_ap_display").remove();

        hooks.off("mapDataRefreshEnd", this.onMapDataRefreshEnd);
        hooks.off("requestFinished", this.onRequestFinished);
    }

    updateIntermediate = () => { this.update(false); }
    onRequestFinished = debounce(this.updateIntermediate, 0.75 * SECONDS);
    onMapDataRefreshEnd = () => { this.onRequestFinished.clear(); this.update(true); };

    update = (hasFinished: boolean) => {

        if (!CalcTools.getDataZoomTileParameters().hasPortals) {
            this.updateNoPortals();
            return;
        }

        const result = this.compAPStats();
        const loading = hasFinished ? "" : "Loading...";

        const formatRow = (team: string, data: APs) => {
            const title = "Destroy and capture " + data.destroyPortals + " portals\n"
                + "Destroy " + data.destroyLinks + " links and " + data.destroyFields + " fields\n"
                + "Capture " + data.capturePortals + " neutral portals, complete " + data.finishPortals + " portals\n"
                + "(unknown additional AP for links/fields)";
            return "<tr><td>" + team + '</td><td style="text-align:right" title="' + title + '">' + digits(data.AP) + "</td></tr>";
        }

        $("#available_ap_display").html("Available AP in this area: "
            + loading
            + "<table>"
            + formatRow("Enlightened", result.enl)
            + formatRow("Resistance", result.res)
            + "</table>");
    }

    updateNoPortals() {
        $("#available_ap_display").html("Available AP in this area: "
            + '<div style="color:red">Zoom closer to get all portals loaded.<div>');
    }


    private compAPStats(): { enl: APs, res: APs } {

        const result = {
            res: { AP: 0, destroyPortals: 0, capturePortals: 0, finishPortals: 0, destroyLinks: 0, destroyFields: 0 },
            enl: { AP: 0, destroyPortals: 0, capturePortals: 0, finishPortals: 0, destroyLinks: 0, destroyFields: 0 },
        };


        const displayBounds = window.map.getBounds();

        // AP to fully deploy a neutral portal
        const PORTAL_FULL_DEPLOY_AP = AP.CAPTURE_PORTAL + 8 * AP.DEPLOY_RESONATOR + AP.COMPLETION_BONUS;

        // Grab every portal in the viewable area and compute individual AP stats
        // (fields and links are counted separately below)
        $.each(window.portals, function (ind, portal) {
            var data = portal.options.data;

            // eliminate offscreen portals
            if (!displayBounds.contains(portal.getLatLng())) return true;

            // AP to complete a portal - assuming it's already captured (so no CAPTURE_PORTAL)
            var completePortalAp = 0;
            if ("resCount" in data && data.resCount < 8) {
                completePortalAp = (8 - data.resCount) * AP.DEPLOY_RESONATOR + AP.COMPLETION_BONUS;
            }

            // AP to destroy this portal
            var destroyAp = (data.resCount || 0) * AP.DESTROY_RESONATOR;

            if (portal.options.team === FACTION.ENL) {
                result.res.AP += destroyAp + PORTAL_FULL_DEPLOY_AP;
                result.res.destroyPortals++;
                if (completePortalAp) {
                    result.enl.AP += completePortalAp;
                    result.enl.finishPortals++;
                }
            } else if (portal.options.team === FACTION.RES) {
                result.enl.AP += destroyAp + PORTAL_FULL_DEPLOY_AP;
                result.enl.destroyPortals++;
                if (completePortalAp) {
                    result.res.AP += completePortalAp;
                    result.res.finishPortals++;
                }
            } else {
                // it's a neutral portal, potential for both teams.  by definition no fields or edges
                result.enl.AP += PORTAL_FULL_DEPLOY_AP;
                result.enl.capturePortals++;
                result.res.AP += PORTAL_FULL_DEPLOY_AP;
                result.res.capturePortals++;
            }
            return true;
        });

        // now every link that starts/ends at a point on screen
        IITCr.links.getInBounds(displayBounds).forEach(link => {
            switch (link.options.team as FACTION) {
                case FACTION.ENL:
                    result.res.AP += AP.DESTROY_LINK;
                    result.res.destroyLinks++;
                    break;
                case FACTION.RES:
                    result.enl.AP += AP.DESTROY_LINK;
                    result.enl.destroyLinks++;
                    break;
                case FACTION.MAC:
                    result.res.AP += AP.DESTROY_LINK;
                    result.res.destroyLinks++;
                    result.enl.AP += AP.DESTROY_LINK;
                    result.enl.destroyLinks++;
                    break;
            }
        });

        // and now all fields that have a vertex on screen
        IITCr.fields.getInBounds(displayBounds).forEach(field => {
            if (field.options.team == FACTION.ENL) {
                result.res.AP += AP.DESTROY_FIELD;
                result.res.destroyFields++;
            } else if (field.options.team == FACTION.RES) {
                result.enl.AP += AP.DESTROY_FIELD;
                result.enl.destroyFields++;
            }
        });

        return result;
    }
}