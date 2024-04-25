import { IITCr } from "./IITC";
import { postAjax } from "./helper/send_request";
import { HOURS, MINUTES } from "./helper/times";
import { idle } from "./map/idle";
import { Log, LogApp } from "./helper/log_apps";
import { EventMapDataEntityInject, hooks } from "./helper/hooks";
import { dialog } from "./ui/dialog";
const log = Log(LogApp.Artifacts);

/**
 * added as part of the ingress #13magnus in november 2013, artifacts
 * are additional game elements overlayed on the intel map
 * - shards: move between portals (along links); more than one can be at a portal
 * - targets: specific portals - one per team
 * the artifact data includes details for the specific portals
 */

type ArtifactResponse = Record<PortalGUID, IITC.EntityPortalDetailed>;

const REFRESH_SUCCESS = 1 * HOURS;  // 1h = every full hour
const REFRESH_JITTER = 2 * MINUTES;  // random jitter
const REFRESH_FAILURE = 2 * MINUTES;  // retry on failure

export class Artifacts {

    private layer: L.LayerGroup;
    private isIdle: boolean;
    private timer: number;

    private portalInfo: Map<PortalGUID, IITC.PortalDataDetail>;
    private entities: IITC.EntityPortal[];


    constructor() {
        this.portalInfo = new Map();
        this.entities = [];

        this.isIdle = false;
        idle.addResumeFunction(() => this.onIdleResume());

        this.timer = window.setTimeout(this.requestData, 100);

        this.layer = new L.LayerGroup();
        IITCr.layers.addOverlay("Artifacts", this.layer);
        IITCr.menu.addEntry({
            name: "View\\Artifcacts",
            onClick: () => this.showArtifactList()
        });


        hooks.on("mapDataEntityInject", this.entityInject);
    }


    onIdleResume() {
        if (this.isIdle) {
            this.isIdle = false;
            this.requestData();
        }
    }

    requestData = () => {
        if (idle.isIdle()) {
            this.isIdle = true;
        } else {
            postAjax("getArtifactPortals", {}, this.handleSuccess, this.handleFailure);
        }
    }

    handleFailure = () => {
        clearTimeout(this.timer);
        this.timer = window.setTimeout(this.requestData, REFRESH_FAILURE);
    }


    handleSuccess = data => {
        this.processData(data);

        const now = Date.now();
        const nextTime = Math.ceil(now / REFRESH_SUCCESS) * REFRESH_SUCCESS + Math.floor(Math.random() * REFRESH_JITTER);
        console.log("Next Artifact refresh at", new Date(nextTime));

        clearTimeout(this.timer);
        this.timer = window.setTimeout(this.requestData, nextTime - now);
    }


    processData(data) {

        if (data.error || !data.result) {
            log.warn("Failed to find result in getArtifactPortals response", data);
            return;
        }

        const oldArtifacts = this.entities;
        this.clearData();

        this.processResult(data.result as ArtifactResponse);
        hooks.trigger("artifactsUpdated", { old: oldArtifacts, "new": this.entities });

        this.updateLayer();
    }


    /**
     * Inject artifact portals into render process
     */
    entityInject = (data: EventMapDataEntityInject) => {
        data.callback(this.entities, "summary");
    }

    clearData() {
        this.portalInfo.clear();
        this.entities = [];
    }

    processResult(portals: ArtifactResponse) {

        // eslint-disable-next-line guard-for-in
        for (const guid in portals) {
            const ent = portals[guid];
            const data = decodeArray.portal(ent, "summary") as IITC.PortalDataDetail;

            if (!data.artifactBrief) {
                // 2/12/2017 - Shard removed from a portal leaves it in artifact results but has no artifactBrief
                log.log("removed artifact", data);
                continue;
            }

            this.portalInfo.set(guid, data);

            // let's pre-generate the entities needed to render the map - array of [guid, timestamp, ent_array]
            this.entities.push([guid, data.timestamp, ent]);

        }

    }

    // used to render portals that would otherwise be below the visible level
    getArtifactEntities() {
        return this.entities;
    }

    getInterestingPortals(): PortalGUID[] {
        return [...this.portalInfo.keys()];
    }

    // quick test for portal being relevant to artifacts - of any type
    isInterestingPortal(guid): boolean {
        return guid in this.portalInfo;
    }

    updateLayer() {
        this.layer.clearLayers();

        this.portalInfo.forEach((data, _guid) => {
            const latlng = L.latLng([data.latE6 / 1e6, data.lngE6 / 1e6]);

            const targetType = Object.keys(data.artifactBrief.target)[0];
            const fragmentType = Object.keys(data.artifactBrief.fragment)[0];
            if (targetType) {
                const iconUrl = "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/" + targetType + "_shard_target.png"
                const iconSize = 100 / 2;
                const opacity = 1.0;

                const icon = L.icon({
                    iconUrl,
                    iconSize: [iconSize, iconSize],
                    iconAnchor: [iconSize / 2, iconSize / 2]
                });

                const marker = L.marker(latlng, { icon: icon, interactive: false, keyboard: false, opacity: opacity });

                this.layer.addLayer(marker);
            } else if (fragmentType) {
                const iconUrl = "//commondatastorage.googleapis.com/ingress.com/img/map_icons/marker_images/" + fragmentType + "_shard.png"
                const iconSize = 60 / 2;
                const opacity = 0.6;

                const icon = L.icon({
                    iconUrl,
                    iconSize: [iconSize, iconSize],
                    iconAnchor: [iconSize / 2, iconSize / 2],
                });

                var marker = L.marker(latlng, { icon: icon, interactive: false, keyboard: false, opacity: opacity });

                this.layer.addLayer(marker);
            }
        });
    }


    showArtifactList() {
        let html = "";

        /*
        if (this.artifactTypes.length === 0) {
            html += "<i>No artifacts at this time</i>";
        }

        let first = true;
        this.artifactTypes.forEach(type => {
            // no nice way to convert the Niantic internal name into the correct display name
            // (we do get the description string once a portal with that shard type is selected - could cache that somewhere?)
            var name = type.capitalize() + " shards";

            if (!first) html += "<hr>";
            first = false;
            html += "<div><b>" + name + "</b></div>";

            html += '<table class="artifact artifact-' + type + '">';
            html += "<tr><th>Portal</th><th>Details</th></tr>";

            var tableRows = [];

            $.each(artifact.portalInfo, function (guid, data) {
                if (type in data) {
                    // this portal has data for this artifact type - add it to the table

                    var onclick = "zoomToAndShowPortal('" + guid + "',[" + data._data.latE6 / 1E6 + "," + data._data.lngE6 / 1E6 + "])";
                    var row = '<tr><td class="portal"><a onclick="' + onclick + '">' + escapeHtmlSpecialChars(data._data.title) + "</a></td>";

                    row += '<td class="info">';

                    if (data[type].target !== undefined) {
                        if (data[type].target == TEAM_NONE) {
                            row += '<span class="target">Target Portal</span> ';
                        } else {
                            row += '<span class="target ' + TEAM_TO_CSS[data[type].target] + '">' + (data[type].target == TEAM_RES ? "Resistance" : "Enlightened") + " target</span> ";
                        }
                    }

                    if (data[type].fragments) {
                        if (data[type].target !== undefined) {
                            row += "<br>";
                        }
                        var fragmentName = "shard";
                        //          row += '<span class="fragments'+(data[type].target?' '+TEAM_TO_CSS[data[type].target]:'')+'">'+fragmentName+': #'+data[type].fragments.join(', #')+'</span> ';
                        row += '<span class="fragments' + (data[type].target ? " " + TEAM_TO_CSS[data[type].target] : "") + '">' + fragmentName + ": yes</span> ";
                    }

                    row += "</td></tr>";

                    // sort by target portals first, then by portal GUID
                    var sortVal = (data[type].target !== undefined ? "A" : "Z") + guid;

                    tableRows.push([sortVal, row]);
                }
            });

            // check for no rows, and add a note to the table instead
            if (tableRows.length == 0) {
                html += '<tr><td colspan="2"><i>No portals at this time</i></td></tr>';
            }

            // sort the rows
            tableRows.sort(function (a, b) {
                if (a[0] == b[0]) return 0;
                else if (a[0] < b[0]) return -1;
                else return 1;
            });

            // and add them to the table
            html += tableRows.map(function (a) { return a[1]; }).join("");


            html += "</table>";
        });

        // In Summer 2015, Niantic changed the data format for artifact portals. We no longer know:
        // - Which team each target portal is for - only that it is a target
        // - Which shards are at each portal, just that it has one or more shards
        // You can select a portal and the detailed data contains the list of shard numbers, but there's still no
        // more information on targets
        */
        dialog({
            title: "Artifacts",
            id: "iitc-artifacts",
            html: html,
            width: 400,
            position: { my: "right center", at: "center-60 center", of: window, collision: "fit" }
        });
    }
}