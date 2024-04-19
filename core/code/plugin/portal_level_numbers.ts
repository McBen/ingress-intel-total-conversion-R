import { IITCr } from "../IITC";
import { Plugin } from "./plugin_base";

const ICON_SIZE = 12;
const MOBILE_SCALE = 1.5;

export class PluginPortalLevelNumbers extends Plugin {
    public name = "Portal Level Numbers";
    public version = "0.2.1";
    public description = "Show portal level numbers on map.";
    public author = "rongou";
    public tags: ["portal", "level", "info"];
    public defaultInactive = true;

    private levelLayers: Map<PortalGUID, L.Marker>;
    private levelLayerGroup: L.LayerGroup;
    private updateTimer: number | undefined;

    constructor() {
        super();

        this.setupCss();
    }

    activate(): void {

        this.levelLayers = new Map();
        this.levelLayerGroup = new L.LayerGroup();
        IITCr.layers.addOverlay("Portal Levels", this.levelLayerGroup, { default: true });

        IITCr.hooks.on("requestFinished", this.onRequestFinished);
        IITCr.hooks.on("mapDataRefreshEnd", this.onMapDataRefreshEnd);
        window.map.on("overlayadd overlayremove", this.onOverlayChanged);

        this.delayedUpdatePortalLabels(2);
    }

    deactivate(): void {

        IITCr.hooks.off("requestFinished", this.onRequestFinished);
        IITCr.hooks.off("mapDataRefreshEnd", this.onMapDataRefreshEnd);
        window.map.off("overlayadd overlayremove", this.onOverlayChanged);

        this.levelLayers.forEach(marker => this.levelLayerGroup.removeLayer(marker));
        this.levelLayers = undefined;

        IITCr.layers.removeOverlay(this.levelLayerGroup);
        this.levelLayerGroup = undefined;
    }


    onRequestFinished = () => { this.delayedUpdatePortalLabels(4); }
    onMapDataRefreshEnd = () => { this.delayedUpdatePortalLabels(0.5); }
    onOverlayChanged = () => { this.delayedUpdatePortalLabels(2); }


    // as calculating portal marker visibility can take some time when there's lots of portals shown, we'll do it on
    // a short timer. this way it doesn't get repeated so much
    delayedUpdatePortalLabels(wait: number): void {
        if (this.updateTimer === undefined) {
            this.updateTimer = window.setTimeout(() => {
                this.updateTimer = undefined;
                this.updatePortalLabels();
            }, wait * 1000);

        }
    }

    private setupCss(): void {
        $("<style>")
            .prop("type", "text/css")
            .html(".plugin-portal-level-numbers {\
                font-size: 10px;\
                color: #FFFFBB;\
                font-family: monospace;\
                text-align: center;\
                text-shadow: 0 0 1px black, 0 0 1em black, 0 0 0.2em black;\
                pointer-events: none;\
                -webkit-text-size-adjust:none;\
              }")
            .appendTo("head");
    }

    private removeLabel(guid: PortalGUID): void {
        const previousLayer = this.levelLayers.get(guid);
        if (previousLayer) {
            this.levelLayerGroup.removeLayer(previousLayer);
            this.levelLayers.delete(guid);
        }
    }

    private addLabel(guid: PortalGUID, latLng: L.LatLng): void {
        this.removeLabel(guid);

        const portal = window.portals[guid];
        const levelNumber = portal.options.level;
        const marker = L.marker(latLng, {
            icon: L.divIcon({
                className: "plugin-portal-level-numbers",
                iconSize: [ICON_SIZE, ICON_SIZE],
                html: levelNumber.toString()
            }),
            interactive: false
        });
        this.levelLayers.set(guid, marker);
        marker.addTo(this.levelLayerGroup);
    }


    updatePortalLabels(): void {

        const SQUARE_SIZE = (ICON_SIZE + 3) * (L.Browser.mobile ? MOBILE_SCALE : 1);

        // as this is called every time layers are toggled, there's no point in doing it when the layer is off
        if (!window.map.hasLayer(this.levelLayerGroup)) {
            return;
        }


        const portalPoints: Map<PortalGUID, L.Point> = new Map();

        // eslint-disable-next-line guard-for-in
        for (const guid in window.portals) {
            const p = window.portals[guid];

            // eslint-disable-next-line no-underscore-dangle
            if ((<any>p)._map && p.options.data.level !== undefined) {  // only consider portals added to the map, and that have a level set
                const point = window.map.project(p.getLatLng());
                portalPoints.set(guid, point);
            }
        }

        // for efficient testing of intersection, group portals into buckets based on the defined rectangle size
        const buckets: Map<string, Set<PortalGUID>> = new Map();

        portalPoints.forEach((point, guid) => {

            const bucketId = L.point([Math.floor(point.x / (SQUARE_SIZE * 2)), Math.floor(point.y / SQUARE_SIZE * 2)]);
            // the guid is added to four buckets. this way, when testing for overlap we don't need to test
            // all 8 buckets surrounding the one around the particular portal, only the bucket it is in itself
            const bucketIds = [bucketId, bucketId.add([1, 0]), bucketId.add([0, 1]), bucketId.add([1, 1])];
            bucketIds.forEach(i => {
                const b = i.toString();
                if (!buckets.has(b)) buckets.set(b, new Set());
                buckets.get(b).add(guid);
            })
        })

        const coveredPortals: Set<PortalGUID> = new Set();

        buckets.forEach(bucketGuids => {
            bucketGuids.forEach(guid => {
                const point = portalPoints.get(guid);
                // the bounds used for testing are twice as wide as the rectangle. this is so that there's no left/right
                // overlap between two different portals text
                const southWest = point.subtract([SQUARE_SIZE, SQUARE_SIZE]);
                const northEast = point.add([SQUARE_SIZE, SQUARE_SIZE]);
                const largeBounds = L.bounds(southWest, northEast);

                for (const otherGuid of bucketGuids) {
                    // do not check portals already marked as covered
                    if (guid !== otherGuid && !coveredPortals[otherGuid]) {
                        const otherPoint = portalPoints.get(otherGuid);

                        if (largeBounds.contains(otherPoint)) {
                            // another portal is within the rectangle - remove if it has not a higher level
                            if (window.portals[guid].options.level <= window.portals[otherGuid].options.level) {
                                coveredPortals.add(guid);
                                break;
                            }
                        }
                    }
                }
            })
        })
        coveredPortals.forEach(guid => portalPoints.delete(guid));

        // remove any not wanted
        this.levelLayers.forEach((_marker, guid) => {
            if (!portalPoints.has(guid)) this.removeLabel(guid);
        })

        // and add those we do
        portalPoints.forEach((_point, guid) => this.addLabel(guid, window.portals[guid].getLatLng()));
    }
}

