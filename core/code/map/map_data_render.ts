import * as L from "leaflet";
import { DEFAULT_ZOOM, FACTION, FACTION_COLORS } from "../constants";
import { TileData } from "./map_data_request";
import { Log, LogApp } from "../helper/log_apps";
import { hooks } from "../helper/hooks";
const log = Log(LogApp.Map);


/**
 * class to handle rendering into leaflet the JSON data from the servers
 */
export class Render {

    private portalMarkerScale: number;

    /**
     *  object - represents the set of all deleted game entity GUIDs seen in a render pass
     */
    private deletedGuid = {};

    private seenPortalsGuid = {};
    private seenLinksGuid = {};
    private seenFieldsGuid = {};

    /**
     * start a render pass. called as we start to make the batch of data requests to the servers
     */
    startRenderPass(bounds: L.LatLngBounds): void {
        this.deletedGuid = {};

        this.seenPortalsGuid = {};
        this.seenLinksGuid = {};
        this.seenFieldsGuid = {};

        // we pad the bounds used for clearing a litle bit, as entities are sometimes returned outside of their specified tile boundaries
        // this will just avoid a few entity removals at start of render when they'll just be added again
        const paddedBounds = bounds.pad(0.1);

        this.clearPortalsOutsideBounds(paddedBounds);

        this.clearLinksOutsideBounds(paddedBounds);
        this.clearFieldsOutsideBounds(paddedBounds);


        this.rescalePortalMarkers();
    }

    clearPortalsOutsideBounds(bounds: L.LatLngBounds): void {
        // eslint-disable-next-line guard-for-in
        for (const guid in window.portals) {
            const portal = window.portals[guid];

            // clear portals outside visible bounds - unless it's the selected portal
            if (!bounds.contains(portal.getLatLng()) && guid !== selectedPortal) {
                this.deletePortalEntity(guid);
            }
        }
    }

    clearLinksOutsideBounds(bounds: L.LatLngBounds): void {
        // eslint-disable-next-line guard-for-in
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
        // eslint-disable-next-line guard-for-in
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
        this.processDeletedGameEntityGuids(tiledata.deletedGameEntityGuids || []);
        this.processGameEntities(tiledata.gameEntities || []);
    }


    processDeletedGameEntityGuids(deleted: string[]): void {
        deleted.forEach(guid => {

            if (!(guid in this.deletedGuid)) {
                this.deletedGuid[guid] = true;  // flag this guid as having being processed

                if (guid === selectedPortal) {
                    // the rare case of the selected portal being deleted. clear the details tab and deselect it
                    window.renderPortalDetails(null);
                }
                this.deleteEntity(guid);
            }
        });
    }

    processGameEntities(entities: IITC.EntityData[], details?: DecodePortalDetails) { // details expected in decodeArray.portal
        // we loop through the entities three times - for fields, links and portals separately
        // this is a reasonably efficient work-around for leafletjs limitations on svg render order

        entities.forEach(ent => {
            if (ent[2][0] === "r" && !(ent[0] in this.deletedGuid)) {
                this.createFieldEntity(ent as IITC.EntityField);
            }
        });

        entities.forEach(ent => {
            if (ent[2][0] === "e" && !(ent[0] in this.deletedGuid)) {
                this.createLinkEntity(ent as IITC.EntityLink);
            }
        });

        entities.forEach(ent => {
            if (ent[2][0] === "p" && !(ent[0] in this.deletedGuid)) {
                this.createPortalEntity(ent as IITC.EntityPortal, details);
            }
        });
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
            // special case for selected portal - it's kept even if not seen
            // artifact (e.g. jarvis shard) portals are also kept - but they're always 'seen'
            if (!(guid in this.seenPortalsGuid) && guid !== selectedPortal) {
                this.deletePortalEntity(guid);
                countp++;
            }
        }
        for (const guid in window.links) {
            if (!(guid in this.seenLinksGuid)) {
                this.deleteLinkEntity(guid);
                countl++;
            }
        }
        for (const guid in window.fields) {
            if (!(guid in this.seenFieldsGuid)) {
                this.deleteFieldEntity(guid);
                countf++;
            }
        }

        log.log(`Render: end cleanup: removed ${countp} portals, ${countl} links, ${countf} fields`);

        // reorder portals to be after links/fields
        this.bringPortalsToFront();

        // re-select the selected portal, to re-render the side-bar. ensures that any data calculated from the map data is up to date
        if (selectedPortal) {
            renderPortalDetails(selectedPortal);
        }
    }


    bringPortalsToFront() {
        portalsFactionLayers.forEach(levelLayer => {
            // portals are stored in separate layers per faction
            // to avoid giving weight to one faction or another, we'll push portals to front based on GUID order
            const lvlPortals: { [index: PortalGUID]: IITC.Portal } = {};
            levelLayer.forEach(factionLayer => {
                // @ts-ignore
                // eslint-disable-next-line no-underscore-dangle
                if (factionLayer._map) {
                    factionLayer.eachLayer((p: IITC.Portal) => {
                        lvlPortals[p.options.guid] = p;
                    });
                }
            });

            const guids = Object.keys(lvlPortals);
            guids.sort();

            guids.forEach(guid => lvlPortals[guid].bringToFront());
        });
    }


    deleteEntity(guid: PortalGUID | LinkGUID | FieldGUID): void {
        this.deletePortalEntity(guid);
        this.deleteLinkEntity(guid);
        this.deleteFieldEntity(guid);
    }

    deletePortalEntity(guid: PortalGUID) {
        const portal = window.portals[guid];
        if (portal) {
            window.ornaments.removePortal(portal);
            this.removePortalFromMapLayer(portal);
            delete window.portals[guid];
            hooks.trigger("portalRemoved", { portal, data: portal.options.data });
        }
    }

    deleteLinkEntity(guid: LinkGUID): void {
        const link = window.links[guid];
        if (link) {
            linksFactionLayers[link.options.team].removeLayer(link);
            delete window.links[guid];
            hooks.trigger("linkRemoved", { link, data: link.options.data });
        }
    }


    deleteFieldEntity(guid: FieldGUID) {
        const field = window.fields[guid];
        if (field) {
            fieldsFactionLayers[field.options.team].removeLayer(field);
            delete window.fields[guid];
            hooks.trigger("fieldRemoved", { field, data: field.options.data });
        }
    }


    createPlaceholderPortalEntity(guid: PortalGUID, latE6: number, lngE6: number, team): void {
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

        // placeholder portals don't have a useful timestamp value - so the standard code that checks for updated
        // portal details doesn't apply
        // so, check that the basic details are valid and delete the existing portal if out of date
        if (guid in window.portals) {
            const p = window.portals[guid];
            if (team !== p.options.data.team || latE6 !== p.options.data.latE6 || lngE6 !== p.options.data.lngE6) {
                // team or location have changed - delete existing portal
                this.deletePortalEntity(guid);
            }
        }

        this.createPortalEntity(ent, "core"); // placeholder
    }

    // TODO. create by PortalInfo
    createPortalEntity(ent: IITC.EntityPortal, details: DecodePortalDetails): void { // details expected in decodeArray.portal
        this.seenPortalsGuid[ent[0]] = true;  // flag we've seen it

        let previousData;
        const data = decodeArray.portal(ent[2], details);

        // check if entity already exists
        if (ent[0] in window.portals) {
            // yes. now check to see if the entity data we have is newer than that in place
            const p = window.portals[ent[0]];

            if (!data.history || p.options.data.history === data.history) {
                if (p.options.timestamp >= ent[1]) {
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

        window.pushPortalGuidPositionCache(ent[0], data.latE6, data.lngE6);

        const marker = createMarker(latlng, dataOptions);

        marker.on("click", event => {
            const portal = event.target as IITC.Portal;
            window.renderPortalDetails(portal.options.guid);
        });
        marker.on("dblclick", event => {
            const portal = event.target as IITC.Portal;
            window.renderPortalDetails(portal.options.guid);
            window.map.setView(portal.getLatLng(), DEFAULT_ZOOM);
        });
        marker.on("contextmenu", event => {
            const portal = event.target as IITC.Portal;
            window.renderPortalDetails(portal.options.guid);
            if (window.isSmartphone()) {
                window.show("info");
            } else if (!$("#scrollwrapper").is(":visible")) {
                $("#sidebartoggle").trigger("click");
            }
        });

        hooks.trigger("portalAdded", { portal: marker, previousData });

        window.portals[ent[0]] = marker;

        // check for URL links to portal, and select it if this is the one
        if (urlPortalLL && urlPortalLL[0] === marker.getLatLng().lat && urlPortalLL[1] === marker.getLatLng().lng) {
            // URL-passed portal found via pll parameter - set the guid-based parameter
            log.log(`urlPortalLL ${urlPortalLL[0]},${urlPortalLL[1]} matches portal GUID ${ent[0]}`);

            urlPortal = ent[0];
            urlPortalLL = undefined;  // clear the URL parameter so it's not matched again
        }
        if (urlPortal === ent[0]) {
            // URL-passed portal found via guid parameter - set it as the selected portal
            log.log(`urlPortal GUID ${urlPortal} found - selecting...`);
            selectedPortal = ent[0];
            urlPortal = undefined;  // clear the URL parameter so it's not matched again
        }

        // (re-)select the portal, to refresh the sidebar on any changes
        if (ent[0] === selectedPortal) {
            log.log(`portal guid ${ent[0]} is the selected portal - re-rendering portal details`);
            renderPortalDetails(selectedPortal);
        }

        window.ornaments.addPortal(marker);

        this.addPortalToMapLayer(marker);
    }


    createFieldEntity(ent: IITC.EntityField) {
        this.seenFieldsGuid[ent[0]] = true;  // flag we've seen it

        const data = {
            //    type: ent[2][0],
            team: ent[2][1],
            points: ent[2][2].map(function (arr) { return { guid: arr[0], latE6: arr[1], lngE6: arr[2] }; })
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

            if (f.options.timestamp >= ent[1]) return; // this data is identical (or order) than that rendered - abort processing

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
            ent,  // LEGACY - TO BE REMOVED AT SOME POINT! use .guid, .timestamp and .data instead
            guid: ent[0],
            timestamp: ent[1],
            data
        });

        hooks.trigger("fieldAdded", { field: poly });

        window.fields[ent[0]] = poly as IITC.Field;

        fieldsFactionLayers[team].addLayer(poly);
    }

    createLinkEntity(ent: IITC.EntityLink): void {
        // Niantic have been faking link entities, based on data from fields
        // these faked links are sent along with the real portal links, causing duplicates
        // the faked ones all have longer GUIDs, based on the field GUID (with _ab, _ac, _bc appended)
        const fakedLink = new RegExp("^[0-9a-f]{32}\.b_[ab][bc]$"); // field GUIDs always end with ".b" - faked links append the edge identifier
        if (fakedLink.test(ent[0])) return;


        this.seenLinksGuid[ent[0]] = true;  // flag we've seen it

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

        // create placeholder entities for link start and end points (before checking if the link itself already exists
        this.createPlaceholderPortalEntity(data.oGuid, data.oLatE6, data.oLngE6, data.team);
        this.createPlaceholderPortalEntity(data.dGuid, data.dLatE6, data.dLngE6, data.team);


        // check if entity already exists
        if (ent[0] in window.links) {
            // yes. now, as sometimes links are 'faked', they have incomplete data. if the data we have is better, replace the data
            const l = window.links[ent[0]];

            // the faked data will have older timestamps than real data (currently, faked set to zero)
            if (l.options.timestamp >= ent[1]) return; // this data is older or identical to the rendered data - abort processing

            // the data is newer/better - two options
            // 1. just update the data. assume the link render appearance is unmodified
            // 2. delete the entity, then re-create it with the new data
            this.deleteLinkEntity(ent[0]); // option 2 - for now
        }

        const team = teamStringToId(ent[2][1]);
        const latlngs = [
            L.latLng(data.oLatE6 * 1e-6, data.oLngE6 * 1e-6),
            L.latLng(data.dLatE6 * 1e-6, data.dLngE6 * 1e-6)
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
        });

        hooks.trigger("linkAdded", { link: poly });

        window.links[ent[0]] = poly as IITC.Link;

        linksFactionLayers[team].addLayer(poly);
    }


    rescalePortalMarkers() {
        if (this.portalMarkerScale === undefined || this.portalMarkerScale !== portalMarkerScale()) {
            this.portalMarkerScale = portalMarkerScale();

            log.log(`Render: map zoom ${window.map.getZoom()} changes portal scale to ${portalMarkerScale()} - redrawing all portals`);

            // NOTE: we're not calling this because it resets highlights - we're calling it as it
            // resets the style (inc size) of all portal markers, applying the new scale
            resetHighlightedPortals();
        }
    }



    /**
     * add the portal to the visible map layer
     */
    addPortalToMapLayer(portal: IITC.Portal) {
        portalsFactionLayers[portal.options.level || 0][portal.options.team].addLayer(portal);
    }


    removePortalFromMapLayer(portal: IITC.Portal) {
        // remove it from the portalsLevels layer
        portalsFactionLayers[portal.options.level || 0][portal.options.team].removeLayer(portal);
    }

}