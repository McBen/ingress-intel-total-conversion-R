import * as L from "leaflet";
import { DEFAULT_ZOOM, FACTION, FACTION_COLORS } from "../constants";
import { TileData } from "./map_data_request";
import { Log, LogApp } from "../helper/log_apps";
import { hooks } from "../helper/hooks";
import { renderPortalDetails } from "../portal/portal_display";
import { IITCr } from "../IITC";
import { createMarker, portalMarkerScale } from "./portal_marker";
import { fieldFilter, linkFilter, portalFilter } from "./filter_layer";
import { entityLayer } from "./map";
const log = Log(LogApp.Map);


interface RenderPortal extends IITC.Portal {
    renderPass: number;
}
interface RenderField extends IITC.Field {
    renderPass: number;
}
interface RenderLink extends IITC.Link {
    renderPass: number;
}


/**
 * class to handle rendering into leaflet the JSON data from the servers
 */
export class Render {

    private portalMarkerScale: number;

    /**
     *  object - represents the set of all deleted game entity GUIDs seen in a render pass
     */
    private deletedGuid = new Set<EntityGUID>();

    /**
     * ID of current renderpass
     */
    private renderPassID: number;

    /**
     * start a render pass. called as we start to make the batch of data requests to the servers
     */
    startRenderPass(bounds: L.LatLngBounds): void {
        this.deletedGuid.clear();

        this.renderPassID = Date.now();

        // we pad the bounds used for clearing a litle bit, as entities are sometimes returned outside of their specified tile boundaries
        // this will just avoid a few entity removals at start of render when they'll just be added again
        const paddedBounds = bounds.pad(0.1);

        this.clearPortalsOutsideBounds(paddedBounds);
        this.clearLinksOutsideBounds(paddedBounds);
        this.clearFieldsOutsideBounds(paddedBounds);


        this.rescalePortalMarkers();
    }

    clearPortalsOutsideBounds(bounds: L.LatLngBounds): void {
        for (const guid in window.portals) {
            const portal = window.portals[guid];

            // clear portals outside visible bounds - unless it's the selected portal
            if (!bounds.contains(portal.getLatLng()) && guid !== selectedPortal) {
                this.deletePortalEntity(guid);
            }
        }
    }

    clearLinksOutsideBounds(bounds: L.LatLngBounds): void {
        for (const guid in window.links) {
            const link = window.links[guid];

            // NOTE: our geodesic lines can have lots of intermediate points. the bounds calculation hasn't been optimised for this
            // so can be particularly slow. a simple bounds check based on start+end point will be good enough for this check
            const lls = link.getLatLngs();
            const linkBounds = L.latLngBounds(lls);

            if (!bounds.intersects(linkBounds)) {
                this.deleteLinkEntity(guid);
            }
        }
    }


    clearFieldsOutsideBounds(bounds: L.LatLngBounds): void {
        for (const guid in window.fields) {
            const field = window.fields[guid];

            // NOTE: our geodesic polys can have lots of intermediate points. the bounds calculation hasn't been optimised for this
            // so can be particularly slow. a simple bounds check based on corner points will be good enough for this check
            const lls = field.getLatLngs();
            const fieldBounds = L.latLngBounds([lls[0], lls[1]]).extend(lls[2]);

            if (!bounds.intersects(fieldBounds)) {
                this.deleteFieldEntity(guid);
            }
        }
    }


    /**
     *  process deleted entity list and entity data
     */
    processTileData(tiledata: TileData) {
        this.processDeletedGameEntityGuids(tiledata.deletedGameEntityGuids ?? []);
        this.processGameEntities(tiledata.gameEntities ?? []);
    }


    processDeletedGameEntityGuids(deleted: string[]): void {
        deleted.forEach(guid => {

            if (!this.deletedGuid.has(guid)) {
                this.deletedGuid.add(guid);  // flag this guid as having being processed

                if (guid === selectedPortal) {
                    // the rare case of the selected portal being deleted. clear the details tab and deselect it
                    renderPortalDetails();
                }
                this.deleteEntity(guid);
            }
        });
    }

    /**
     *
     * @param details expected in decodeArray.portal
     */
    processGameEntities(entities: IITC.EntityData[], details?: DecodePortalDetails) {
        const rest = entities.filter(ent => !this.deletedGuid.has(ent[0]));

        rest.filter(ent => ent[2][0] === "r")
            .forEach(ent => this.createFieldEntity(ent as IITC.EntityField));

        rest.filter(ent => ent[2][0] === "e")
            .forEach(ent => this.createLinkEntity(ent as IITC.EntityLink));

        rest.filter(ent => ent[2][0] === "p")
            .forEach(ent => this.createPortalEntity(ent as IITC.EntityPortal, details!));
    }


    /**
     * end a render pass. does any cleaning up required, postponed processing of data, etc. called when the render
     * is considered complete
     */
    endRenderPass() {
        let countp = 0;
        let countl = 0;
        let countf = 0;

        // check to see if there are any entities we haven't seen. if so, delete them
        for (const guid in window.portals) {
            const portal = window.portals[guid];
            // special case for selected portal - it's kept even if not seen
            if ((portal as RenderPortal).renderPass !== this.renderPassID && guid !== selectedPortal) {
                this.deletePortalEntity(guid);
                countp++;
            }
        }
        for (const guid in window.links) {
            if ((window.links[guid] as RenderLink).renderPass !== this.renderPassID) {
                this.deleteLinkEntity(guid);
                countl++;
            }
        }
        for (const guid in window.fields) {
            if ((window.fields[guid] as RenderField).renderPass !== this.renderPassID) {
                this.deleteFieldEntity(guid);
                countf++;
            }
        }

        log.debug(`Render: end cleanup: removed ${countp} portals, ${countl} links, ${countf} fields`);

        // reorder portals to be after links/fields
        this.bringPortalsToFront();

        // re-select the selected portal, to re-render the side-bar. ensures that any data calculated from the map data is up to date
        if (selectedPortal) {
            renderPortalDetails(selectedPortal);
        }
    }


    bringPortalsToFront() {
        for (const guid in window.portals) {
            window.portals[guid].bringToFront();
        }
    }


    deleteEntity(guid: EntityGUID): void {
        this.deletePortalEntity(guid);
        this.deleteLinkEntity(guid);
        this.deleteFieldEntity(guid);
    }

    deletePortalEntity(guid: PortalGUID) {
        const portal = window.portals[guid];
        if (portal) {
            window.ornaments.removePortal(portal);
            portal.remove();
            delete window.portals[guid];
            hooks.trigger("portalRemoved", { portal, data: portal.options.data });
        }
    }

    deleteLinkEntity(guid: LinkGUID): void {
        const link = window.links[guid];
        if (link) {
            link.remove();
            delete window.links[guid];
            hooks.trigger("linkRemoved", { link, data: link.options.data });
        }
    }


    deleteFieldEntity(guid: FieldGUID) {
        const field = window.fields[guid];
        if (field) {
            field.remove();
            delete window.fields[guid];
            hooks.trigger("fieldRemoved", { field, data: field.options.data });
        }
    }


    createPlaceholderPortalEntity(guid: PortalGUID, latE6: number, lngE6: number, team: IITC.EntityTeam): void {
        // intel no longer returns portals at anything but the closest zoom
        // stock intel creates 'placeholder' portals from the data in links/fields - IITC needs to do the same
        // we only have the portal guid, lat/lng coords, and the faction - no other data
        // having the guid, at least, allows the portal details to be loaded once it's selected. however,
        // no highlighters, portal level numbers, portal names, useful counts of portals, etc are possible
        const ent: IITC.EntityPortal = [
            guid,       // ent[0] = guid
            0,          // ent[1] = timestamp - zero will mean any other source of portal data will have a higher timestamp
            // ent[2] = an array with the entity data
            ["p",      // 0 - a portal
                team,     // 1 - team
                latE6,    // 2 - lat
                lngE6     // 3 - lng
            ]
        ];

        // check basic details are valid and delete the existing portal if out of date
        const p = window.portals[guid];
        if (p) {
            (p as RenderPortal).renderPass = this.renderPassID;

            if (team === p.options.data.team) return;

            // if team has changed replace existing portal
            this.deletePortalEntity(guid);
        }

        this.createPortalEntity(ent, "core");
    }

    // TODO. create by PortalInfo
    createPortalEntity(ent: IITC.EntityPortal, details: DecodePortalDetails): void { // details expected in decodeArray.portal

        let previousData;
        const data = decodeArray.portal(ent[2] as IITC.EntityPortalDetailed, details);

        // check if entity already exists
        if (ent[0] in window.portals) {
            // yes. now check to see if the entity data we have is newer than that in place
            const p = window.portals[ent[0]];

            if (!data.history || p.options.data.history === data.history) {
                if (p.options.timestamp >= ent[1]) {
                    (p as RenderPortal).renderPass = this.renderPassID;
                    return; // this data is identical or older - abort processing
                }
            }

            // the data we have is newer. many data changes require re-rendering of the portal
            // (e.g. level changed, so size is different, or stats changed so highlighter is different)
            // so to keep things simple we'll always re-create the entity in this case

            // remember the old details, for the callback
            previousData = p.options.data;

            // preserve history
            if (!data.history) {
                data.history = previousData.history;
            }

            this.deletePortalEntity(ent[0]);
        }

        let portalLevel = data.level;
        const team = teamStringToId(data.team);
        // the data returns unclaimed portals as level 1 - but IITC wants them treated as level 0
        if (team === FACTION.none) portalLevel = 0;

        const latlng = L.latLng(data.latE6 / 1e6, data.lngE6 / 1e6);

        const dataOptions: IITC.PortalOptions = {
            level: portalLevel,
            team,
            ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
            guid: ent[0],
            timestamp: ent[1],
            data,
            radius: 10
        };

        const marker = createMarker(latlng, dataOptions);

        marker.on("click", event => {
            const portal = event.target as IITC.Portal;
            renderPortalDetails(portal.options.guid);
        });
        marker.on("dblclick", event => {
            const portal = event.target as IITC.Portal;
            renderPortalDetails(portal.options.guid);
            window.map.setView(portal.getLatLng(), DEFAULT_ZOOM);
        });
        marker.on("contextmenu", event => {
            const portal = event.target as IITC.Portal;
            renderPortalDetails(portal.options.guid);
        });

        hooks.trigger("portalAdded", { portal: marker, previousData });
        (marker as RenderPortal).renderPass = this.renderPassID;
        window.portals[ent[0]] = marker;

        // (re-)select the portal, to refresh the sidebar on any changes
        if (ent[0] === selectedPortal) {
            log.log(`portal guid ${ent[0]} is the selected portal - re-rendering portal details`);
            renderPortalDetails(selectedPortal);
        }

        window.ornaments.addPortal(marker);

        if (!portalFilter.filter(marker)) {
            marker.addTo(entityLayer);
        };
    }


    createFieldEntity(ent: IITC.EntityField) {

        const data = {
            //    type: ent[2][0],
            team: ent[2][1],
            points: ent[2][2].map(anchors => ({ guid: anchors[0], latE6: anchors[1], lngE6: anchors[2] }))
        };

        // create placeholder portals for field corners. we already do links, but there are the odd case where this is useful
        for (let i = 0; i < 3; i++) {
            const p = data.points[i];
            this.createPlaceholderPortalEntity(p.guid, p.latE6, p.lngE6, data.team);
        }

        // check if entity already exists
        if (ent[0] in window.fields) {
            // yes. in theory, we should never get updated data for an existing field. they're created, and they're destroyed - never changed
            // but theory and practice may not be the same thing...
            const f = window.fields[ent[0]];

            if (f.options.timestamp >= ent[1]) {
                // this data is identical (or order) than that rendered - abort processing                
                (f as RenderField).renderPass = this.renderPassID;
                return;
            }

            // the data we have is newer - two options
            // 1. just update the data, assume the field render appearance is unmodified
            // 2. delete the entity, then re-create with the new data
            this.deleteFieldEntity(ent[0]); // option 2, for now
        }

        const team = teamStringToId(ent[2][1]);
        const latlngs = [
            L.latLng(data.points[0].latE6 / 1e6, data.points[0].lngE6 / 1e6),
            L.latLng(data.points[1].latE6 / 1e6, data.points[1].lngE6 / 1e6),
            L.latLng(data.points[2].latE6 / 1e6, data.points[2].lngE6 / 1e6)
        ];

        const poly = L.geodesicPolygon(latlngs, <IITC.FieldOptions>{
            fillColor: FACTION_COLORS[team],
            fillOpacity: 0.25,
            stroke: false,
            interactive: false,

            team,
            ent,  // @deprecated  - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
            guid: ent[0],
            timestamp: ent[1],
            data
        }) as IITC.Field;

        hooks.trigger("fieldAdded", { field: poly });

        (poly as RenderField).renderPass = this.renderPassID;
        window.fields[ent[0]] = poly;

        if (!fieldFilter.filter(poly)) {
            poly.addTo(entityLayer);
        };
    }

    createLinkEntity(ent: IITC.EntityLink): void {
        // Niantic have been faking link entities, based on data from fields
        // these faked links are sent along with the real portal links, causing duplicates
        // the faked ones all have longer GUIDs, based on the field GUID (with _ab, _ac, _bc appended)
        const fakedLink = new RegExp("^[0-9a-f]{32}\\.b_[ab][bc]$"); // field GUIDs always end with ".b" - faked links append the edge identifier
        if (fakedLink.test(ent[0])) return;


        const data = { // TODO add other properties and check correction direction
            //    type:   ent[2][0],
            team: ent[2][1],
            oGuid: ent[2][2],
            oLatE6: ent[2][3],
            oLngE6: ent[2][4],
            dGuid: ent[2][5],
            dLatE6: ent[2][6],
            dLngE6: ent[2][7]
        };

        if (data.team === "N") {
            data.team = "M";
        }

        // create placeholder entities for link start and end points (before checking if the link itself already exists
        this.createPlaceholderPortalEntity(data.oGuid, data.oLatE6, data.oLngE6, data.team);
        this.createPlaceholderPortalEntity(data.dGuid, data.dLatE6, data.dLngE6, data.team);


        // check if entity already exists
        if (ent[0] in window.links) {
            // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
            const l = window.links[ent[0]];

            // the faked data will have older timestamps than real data (currently, faked set to zero)
            if (l.options.timestamp >= ent[1]) {
                // this data is older or identical to the rendered data - abort processing
                (l as RenderLink).renderPass = this.renderPassID;
                return;
            }

            // the data is newer/better - two options
            // 1. just update the data. assume the link render appearance is unmodified
            // 2. delete the entity, then re-create it with the new data
            this.deleteLinkEntity(ent[0]); // option 2 - for now
        }

        const team = teamStringToId(ent[2][1]);
        const latlngs = [
            L.latLng(data.oLatE6 / 1e6, data.oLngE6 / 1e6),
            L.latLng(data.dLatE6 / 1e6, data.dLngE6 / 1e6)
        ];
        const poly = L.geodesicPolyline(latlngs, <IITC.LinkOptions>{
            color: FACTION_COLORS[team],
            opacity: 1,
            weight: 2,
            interactive: false,

            team,
            ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
            guid: ent[0],
            timestamp: ent[1],
            data
        }) as IITC.Link;

        hooks.trigger("linkAdded", { link: poly });

        (poly as RenderLink).renderPass = this.renderPassID;
        window.links[ent[0]] = poly;

        if (!linkFilter.filter(poly)) {
            poly.addTo(entityLayer);
        };
    }


    rescalePortalMarkers() {
        if (this.portalMarkerScale === undefined || this.portalMarkerScale !== portalMarkerScale()) {
            this.portalMarkerScale = portalMarkerScale();

            log.log(`Render: map zoom ${window.map.getZoom()} changes portal scale to ${portalMarkerScale()} - redrawing all portals`);

            // NOTE: we're not calling this because it resets highlights - we're calling it as it
            // resets the style (inc size) of all portal markers, applying the new scale
            IITCr.highlighter.resetPortals();
        }
    }
}