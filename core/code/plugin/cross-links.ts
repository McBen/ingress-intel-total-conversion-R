import { lineCrossing } from "../helper/geodesic-math";
import { EventLinkAdded } from "../helper/hooks";
import { IITCr } from "../IITC";
import { Plugin } from "./plugin_base";



export class CrossLinks extends Plugin {
    public name = "Cross links";
    public version = "1.4";
    public description = "Checks for existing links that cross planned links. Requires draw-tools plugin";
    public author = "mcben";
    public tags: ["links", "blocker", "crosslink", "draw"];
    public requires: ["Draw tools"];

    public defaultInactive = true;

    private disabled: boolean;
    private linkLayer: L.FeatureGroup;
    private drawnLinks: Set<LinkGUID>;


    activate() {

        this.createLayer();
        IITCr.hooks.on("pluginDrawTools", this.onPluginDrawToolsEvent);
        IITCr.hooks.on("linkAdded", this.onLinkAdded);
        IITCr.hooks.on("mapDataRefreshEnd", this.onMapDataRefreshEnd);

    }

    deactivate() {
        this.destroyLayer();
        IITCr.hooks.off("pluginDrawTools", this.onPluginDrawToolsEvent);
        IITCr.hooks.off("linkAdded", this.onLinkAdded);
        IITCr.hooks.off("mapDataRefreshEnd", this.onMapDataRefreshEnd);
    }


    onPluginDrawToolsEvent = (event: any) => {
        if (event.event === "layerCreated") {
            this.testAllLinksAgainstLayer(event.layer as L.Polygon);
        } else {
            this.checkAllLinks();
        }
    }


    testPolyLine(polyline: L.Polyline, link: L.Polyline, closed: boolean = false): boolean {

        const a = link.getLatLngs() as L.LatLng[];
        const b = polyline.getLatLngs() as L.LatLng[];

        for (let i = 0; i < b.length - 1; ++i) {
            if (lineCrossing(a[0], a[1], b[i], b[i + 1])) return true;
        }

        if (closed) {
            if (lineCrossing(a[0], a[1], b.at(-1)!, b[0])) return true;
        }

        return false;
    }

    onLinkAdded = (data: EventLinkAdded) => {
        if (this.disabled) return;
        this.testLink(data.link);
    }

    checkAllLinks = () => {
        if (this.disabled) return;

        console.debug("Cross-Links: checking all links");
        this.clearDrawn();
        IITCr.links.all.forEach(link => this.testLink(link));
    }

    testLink(link: IITC.Link) {
        if (this.drawnLinks.has(link.options.guid)) return;

        // eslint-disable-next-line no-underscore-dangle
        const drawToolLinks = Object.values(window.plugin.drawTools.drawnItems._layers as ArrayLike<L.Layer>);

        drawToolLinks.some(layer => {
            if (layer instanceof L.GeodesicPolygon) {
                if (this.testPolyLine(layer as L.GeodesicPolyline, link, true)) {
                    this.showLink(link);
                    return true;
                }
            } else if (layer instanceof L.GeodesicPolyline) {
                if (this.testPolyLine(layer as L.GeodesicPolyline, link)) {
                    this.showLink(link);
                    return true;
                }
            }
            return;
        });
    }


    showLink(link: IITC.Link) {

        const poly = L.geodesicPolyline(link.getLatLngs(), {
            color: "#d22",
            opacity: 0.7,
            weight: 5,
            interactive: false,
            dashArray: "8,8",

            guid: link.options.guid
        } as L.PolylineOptions);

        poly.addTo(this.linkLayer);
        this.drawnLinks.add(link.options.guid);
    }

    onMapDataRefreshEnd = () => {
        if (this.disabled) return;

        this.linkLayer.bringToFront();

        this.testForDeletedLinks();
    }


    testAllLinksAgainstLayer(layer: L.Layer) {
        if (this.disabled) return;

        IITCr.links.all.forEach(link => {
            if (!this.drawnLinks.has(link.options.guid)) {
                if (layer instanceof L.GeodesicPolygon) {
                    if (this.testPolyLine(layer as L.GeodesicPolygon, link, true)) {
                        this.showLink(link);
                    }
                } else if (layer instanceof L.GeodesicPolyline) {
                    if (this.testPolyLine(layer as L.GeodesicPolyline, link)) {
                        this.showLink(link);
                    }
                }
            }
        })
    }


    testForDeletedLinks() {
        this.linkLayer.eachLayer(layer => {
            const guid: PortalGUID = (layer.options as any).guid;
            if (IITCr.links.get(guid) === undefined) {
                this.linkLayer.removeLayer(layer);
                this.drawnLinks.delete(guid);
            }
        });
    }


    createLayer() {
        this.linkLayer = new L.FeatureGroup();
        this.drawnLinks = new Set();
        IITCr.layers.addOverlay("Cross Links", this.linkLayer);

        window.map.on("layeradd", this.onLayerAdd);
        window.map.on("layerremove", this.onLayerRemove);

        this.disabled = !window.map.hasLayer(this.linkLayer);
    }


    destroyLayer() {
        this.clearDrawn();
        IITCr.layers.removeOverlay(this.linkLayer);

        window.map.off("layeradd", this.onLayerAdd);
        window.map.off("layerremove", this.onLayerRemove);
    }

    private onLayerAdd = (event: any) => {
        if (event.layer === this.linkLayer) {
            this.disabled = false;
            this.checkAllLinks();
        }
    }

    private onLayerRemove = (event: any) => {
        if (event.layer === this.linkLayer) {
            this.disabled = false;
            this.checkAllLinks();
        }
    }

    private clearDrawn() {
        this.linkLayer.clearLayers();
        this.drawnLinks.clear();
    }
}
