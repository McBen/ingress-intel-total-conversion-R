import { DEFAULT_ZOOM, FACTION, FACTION_NAMES, MIN_ZOOM } from "../constants";
import { addHook } from "../helper/hooks";
import { Log, LogApp } from "../helper/log_apps";
import { getURLParam, readCookie, writeCookie } from "../utils_misc";
import { player } from "../helper/player";
import { idle } from "./idle";
import { ON_MOVE_REFRESH, requests, startRefreshTimeout } from "../helper/send_request";
import { GLOPT, IITCOptions } from "../helper/options";
const log = Log(LogApp.Map);


export const setupMap = (): void => {
    setupCRS();
    createMap();
    createLayers();


    window.map.on("moveend", () => {
        const center = window.map.getCenter().wrap();
        writeCookie("ingress.intelmap.lat", center.lat.toString());
        writeCookie("ingress.intelmap.lng", center.lng.toString());
        writeCookie("ingress.intelmap.zoom", window.map.getZoom().toString());
    });

    // map update status handling & update map hooks
    // ensures order of calls
    window.map.on("movestart", () => {
        requests.abort();
        startRefreshTimeout(-1);
    });
    window.map.on("moveend", () => {
        startRefreshTimeout(ON_MOVE_REFRESH);
    });

    // set a 'moveend' handler for the map to clear idle state. e.g. after mobile 'my location' is used.
    // possibly some cases when resizing desktop browser too
    window.map.on("moveend", () => idle.reset());

    idle.addResumeFunction(() => {
        startRefreshTimeout(ON_MOVE_REFRESH);
    });


    // adds a base layer to the map. done separately from the above,
    // so that plugins that add base layers can be the default
    addHook("iitcLoaded", () => {

        const lastBaseMap: string = IITCOptions.get(GLOPT.BASE_MAP_LAYER);
        const lastMap = lastBaseMap && window.layerChooser.getLayer(lastBaseMap);
        const baselayer: L.Layer = lastMap ?? window.layerChooser.getLayer("CartoDB Dark Matter")
        console.assert(baselayer, "baseLayer not found")
        window.map.addLayer(baselayer);


        // (setting an initial position, before a base layer is added, causes issues with leaflet) // todo check
        let pos = getPosition();
        if (!pos) {
            pos = { center: [0, 0], zoom: 1 };
            window.map.locate({ setView: true });
        }
        window.map.setView(pos.center, pos.zoom, { reset: true } as L.ZoomPanOptions); // undocumented Leaflet Option

        // read here ONCE, so the URL is only evaluated one time after the
        // necessary data has been loaded.
        const pll = getURLParam("pll");
        if (pll) {
            const pllSplit = pll.split(",");
            window.urlPortalLL = normLL(pllSplit[0], pllSplit[1]).center;
        }
        window.urlPortal = getURLParam("pguid");

        window.map.on("baselayerchange", event => {
            IITCOptions.set(GLOPT.BASE_MAP_LAYER, event.name);
            // leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
            window.map.setZoom(window.map.getZoom());
        });
    });
};


const createMap = (): void => {
    $("#map").text(""); // clear 'Loading, please wait'

    const map = L.map("map", L.extend({
        // proper initial position is now delayed until all plugins are loaded and the base layer is set
        center: [0, 0],
        zoom: 1,
        crs: (L.CRS as any).S2,
        minZoom: MIN_ZOOM,
        markerZoomAnimation: false,
        bounceAtZoomLimits: false,
        maxBoundsViscosity: 0.7,
        worldCopyJump: true,
    }, window.mapOptions) as L.MapOptions);

    const max_lat = (map.options.crs as any).projection.MAX_LATITUDE;
    map.setMaxBounds([[max_lat, 360], [-max_lat, -360]]);

    L.Renderer.mergeOptions({
        padding: window.RENDERER_PADDING || 0.5
    });

    // add empty div to leaflet control areas - to force other leaflet controls to move around IITC UI elements
    // TODO? move the actual IITC DOM into the leaflet control areas, so dummy <div>s aren't needed
    if (!isSmartphone()) {
        // chat window area
        $("<div>").addClass("leaflet-control")
            .width(708).height(108)
            .css({
                "pointer-events": "none",
                "margin": "0"
            }).appendTo((map as any)._controlCorners.bottomleft);
    }

    map.attributionControl.setPrefix("");

    window.map = map;
}


const createLayers = () => {
    const baseLayers = createDefaultBaseMapLayers();
    const overlays = createDefaultOverlays();

    window.layerChooser = new LayerChooser(baseLayers as any, overlays as any, { map: window.map } as L.Control.LayersOptions)
        .addTo(window.map);

    if (!areAllLayerVisible(overlays)) {
        // as users often become confused if they accidentally switch a standard layer off, display a warning in this case
        $("#portaldetails")
            .html('<div class="layer_off_warning">'
                + "<p><b>Warning</b>: some of the standard layers are turned off. Some portals/links/fields will not be visible.</p>"
                + '<a id="enable_standard_layers">Enable standard layers</a>'
                + "</div>");
        $("#enable_standard_layers").on("click", () => {

            // eslint-disable-next-line guard-for-in
            for (const name in overlays) {
                const overlay: L.Layer = overlays[name];
                if (!window.map.hasLayer(overlay)) {
                    window.map.addLayer(overlay);
                }
            }
            $("#portaldetails").html("");
        });
    }
}


const areAllLayerVisible = (overlays: LayerList): boolean => {
    // eslint-disable-next-line guard-for-in
    for (const name in overlays) {
        const layer: L.Layer = overlays[name];
        if (!window.map.hasLayer(layer)) {
            return false;
        }
    }

    return true;
}


interface S2Projection extends L.Projection {
    R: number;
}

interface SphericalMercatorS2 extends L.Projection {
    S2: S2Projection;
}

const setupCRS = () => {
    // use the earth radius value from s2 geometry library
    // https://github.com/google/s2-geometry-library-java/blob/c28f287b996c0cedc5516a0426fbd49f6c9611ec/src/com/google/common/geometry/S2LatLng.java#L31
    const EARTH_RADIUS_METERS = 6367000.0;
    // distance calculations with that constant are a little closer to values observable in Ingress client.
    // difference is:
    // - ~0.06% when using LatLng.distanceTo() (R is 6371 vs 6367)
    // - ~0.17% when using Map.distance() / CRS.destance() (R is 6378.137 vs 6367)
    // (Yes, Leaflet is not consistent here, e.g. see https://github.com/Leaflet/Leaflet/pull/6928)

    // this affects LatLng.distanceTo(), which is currently used in most iitc plugins
    (L.CRS.Earth as any).R = EARTH_RADIUS_METERS;

    // this affects Map.distance(), which is known to be used in draw-tools
    const SphericalMercator = L.Projection.SphericalMercator as SphericalMercatorS2;
    SphericalMercator.S2 = L.extend({}, SphericalMercator, {
        R: EARTH_RADIUS_METERS,
        bounds: (() => {
            const d = EARTH_RADIUS_METERS * Math.PI;
            return L.bounds([-d, -d], [d, d]);
        })()
    });

    (L.CRS as any).S2 = L.extend({}, L.CRS.Earth, {
        code: "Ingress",
        projection: SphericalMercator.S2,
        transformation: (() => {
            const scale = 0.5 / (Math.PI * SphericalMercator.S2.R);
            return L.transformation(scale, 0.5, -scale, 0.5);
        })()
    });
}


type NormalizedPosition = {
    center: [number, number],
    zoom: number
}

const normLL = (lat: string | number, lng: string | number, zoom?: string): NormalizedPosition => {
    return {
        center: [
            parseFloat(lat as string) || 0,
            parseFloat(lng as string) || 0
        ],
        zoom: parseInt(zoom) || DEFAULT_ZOOM
    };
}

/**
 * retrieves the last shown position from URL or from a cookie
 */
const getPosition = (): NormalizedPosition | undefined => {

    const zoom = getURLParam("z");
    const latE6 = getURLParam("latE6");
    const lngE6 = getURLParam("lngE6");
    if (latE6 && lngE6) {
        log.log("mappos: reading email URL params");
        return normLL(parseInt(latE6) * 1e-6, parseInt(lngE6) * 1e-6, zoom);
    }

    const ll = getURLParam("ll") || getURLParam("pll");
    if (ll) {
        log.log("mappos: reading stock Intel URL params");
        const llSplit = ll.split(",");
        return normLL(llSplit[0], llSplit[1], zoom);
    }

    const lat = readCookie("ingress.intelmap.lat");
    const lng = readCookie("ingress.intelmap.lng");
    if (lat && lng) {
        log.log("mappos: reading cookies");
        return normLL(lat, lng, readCookie("ingress.intelmap.zoom"));
    }
}

type LayerList = Map<string, L.Layer>;

const createDefaultBaseMapLayers = (): LayerList => {
    const baseLayers: LayerList = new Map();

    // cartodb has some nice tiles too - both dark and light subtle maps - http://cartodb.com/basemaps/
    // (not available over https though - not on the right domain name anyway)
    const attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
        '&copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
    const cartoUrl = "https://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}.png";
    baseLayers["CartoDB Dark Matter"] = L.tileLayer(cartoUrl, { attribution, theme: "dark_all" } as L.TileLayerOptions);
    baseLayers["CartoDB Positron"] = L.tileLayer(cartoUrl, { attribution, theme: "light_all" } as L.TileLayerOptions);

    // Google Maps - including ingress default (using the stock-intel API-key)
    const googleMutant = (L.gridLayer as any).googleMutant as (options: any) => L.GridLayer; // FIXME: temp workaround
    baseLayers["Google Default Ingress Map"] = googleMutant(
        {
            type: "roadmap",
            backgroundColor: "#0e3d4e",
            styles: [
                {
                    featureType: "all", elementType: "all",
                    stylers: [{ visibility: "on" }, { hue: "#131c1c" }, { saturation: "-50" }, { invert_lightness: true }]
                },
                {
                    featureType: "water", elementType: "all",
                    stylers: [{ visibility: "on" }, { hue: "#005eff" }, { invert_lightness: true }]
                },
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "labels.icon", stylers: [{ invert_lightness: !0 }] }
            ]
        });
    baseLayers["Google Roads"] = googleMutant({ type: "roadmap" });
    const trafficMutant = googleMutant({ type: "roadmap" });
    // FIXME
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    trafficMutant.addGoogleLayer("TrafficLayer");
    baseLayers["Google Roads + Traffic"] = trafficMutant;
    baseLayers["Google Satellite"] = googleMutant({ type: "satellite" });
    baseLayers["Google Hybrid"] = googleMutant({ type: "hybrid" });
    baseLayers["Google Terrain"] = googleMutant({ type: "terrain" });

    return baseLayers;
}


const createDefaultOverlays = (): LayerList => {

    const addLayers: LayerList = new Map();

    portalsFactionLayers = [];
    const portalsLayers: L.LayerGroup[] = [];
    for (let i = 0; i <= 8; i++) {
        portalsFactionLayers[i] = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
        portalsLayers[i] = L.layerGroup();
        const name = (i === 0 ? "Unclaimed/Placeholder Portals" : `Level ${i} Portals`);
        addLayers[name] = portalsLayers[i];
    }

    fieldsFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    const fieldsLayer = L.layerGroup();
    addLayers["Fields"] = fieldsLayer;

    linksFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    const linksLayer = L.layerGroup();
    addLayers["Links"] = linksLayer;

    // faction-specific layers
    // these layers don't actually contain any data. instead, every time they're added/removed from the map,
    // the matching sub-layers within the above portals/fields/links are added/removed from their parent with
    // the below 'onoverlayadd/onoverlayremove' events
    const factionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    factionLayers.forEach((facLayer, facIndex) => {
        facLayer.on("add", () => {
            fieldsLayer.addLayer(fieldsFactionLayers[facIndex]);
            linksLayer.addLayer(linksFactionLayers[facIndex]);
            portalsLayers.forEach((portals, lvl) => {
                portals.addLayer(portalsFactionLayers[lvl][facIndex]);
            });
        });
        facLayer.on("remove", () => {
            fieldsLayer.removeLayer(fieldsFactionLayers[facIndex]);
            linksLayer.removeLayer(linksFactionLayers[facIndex]);
            portalsLayers.forEach((portals, lvl) => {
                portals.removeLayer(portalsFactionLayers[lvl][facIndex]);
            });
        });
        addLayers[FACTION_NAMES[facIndex]] = facLayer;
    });

    // to avoid any favouritism, we'll put the player's own faction layer first
    if (!player.isTeam(FACTION.RES)) {
        const name_res = FACTION_NAMES[FACTION.RES];
        delete addLayers[name_res];
        addLayers[name_res] = factionLayers[FACTION.RES];
    }

    return addLayers;
}

// to be extended in app.js (or by plugins: `setup.priority = 'boot';`)
window.mapOptions = {
    preferCanvas: "PREFER_CANVAS" in window
        ? window.PREFER_CANVAS
        : true // default
};

