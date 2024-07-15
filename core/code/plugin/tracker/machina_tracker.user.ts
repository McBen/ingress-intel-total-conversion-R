import { ago, HOURS } from "../../helper/times";
import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";
import * as Chat from "../../helper/chatlines";
import * as ChatParse from "../../helper/chatparser";
import { hooks } from "../../helper/hooks";
import { isTouchDevice } from "./player_activity_tracker";


const MACHINA_TRACKER_MAX_TIME = 8 * HOURS;
const MACHINA_TRACKER_MIN_ZOOM = 9;
const MACHINA_TRACKER_AGE_OPACITY = 0.2;

const iconImage = 'data:image/png;base64,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';

interface Action {
  time: number;
  latlng: L.LatLng;
  name: string,
  address: string
}

const C = Chat.ChatLineType;
const InfoMessages = [
  C.CAPTURE, C.DEPLOY, C.LINK
];

export class MachinaTracker extends Plugin {
  public name = "Machina tracker";
  public version = "1.0.0";
  public description = "Show locations of Machina activities.";
  public author = "McBen";
  public tags: ["machina", "red", "track", "where"];
  public defaultInactive = true;

  public stored: Action[];
  private drawnTraces: L.LayerGroup;
  private icon: L.Icon;
  private isInvalidate: boolean;

  constructor() {
    super();

    this.stored = [];
  }

  activate(): void {

    this.icon = L.icon({
      iconUrl: iconImage,
      iconSize: [26, 32],
      iconAnchor: [12, 32],
    });

    this.drawnTraces = new L.LayerGroup();
    IITCr.layers.addOverlay('Machina Tracker', this.drawnTraces, { default: true });

    hooks.chat.on(InfoMessages, this.onChatMessage, true);
    hooks.chat.on(Chat.ChatLineType.UPDATE_DONE, this.onChatUpdated);
    window.map.on("zoomend", this.onZoom);
    this.onZoom();
  }


  deactivate(): void {
    IITCr.layers.removeOverlay(this.drawnTraces);

    window.map.off("zoomend", this.onZoom);
    hooks.chat.off(InfoMessages, this.onChatMessage, true);
    hooks.chat.off(Chat.ChatLineType.UPDATE_DONE, this.onChatUpdated);
  }


  onZoom = (): void => {
    this.zoomListener();
  }

  zoomListener = (): void => {
    if (window.map.getZoom() < MACHINA_TRACKER_MIN_ZOOM) {
      this.drawnTraces.clearLayers();
    }
  }

  private getLimit() {
    return Date.now() - MACHINA_TRACKER_MAX_TIME;
  }

  private discardOldData() {
    const limit = this.getLimit();
    this.stored = this.stored.filter(event => event.time >= limit);
  }


  onChatMessage = (_type: Chat.ChatLineType, line: Intel.ChatLine) => {
    if (window.map.getZoom() < MACHINA_TRACKER_MIN_ZOOM) return;

    if (line[2].plext.team !== 'NEUTRAL') return;

    const time = ChatParse.getTime(line);
    if (time < this.getLimit()) return;

    const portal = ChatParse.getPortal(line);

    this.addAction({
      time,
      latlng: L.latLng(portal.latE6 / 1e6, portal.lngE6 / 1e6),
      name: portal.plain,
      address: portal.address
    });

    this.isInvalidate = true;
  }


  addAction(newEvent: Action) {

    if (this.stored.some(action => action.time === newEvent.time && action.latlng.equals(newEvent.latlng)))
      return;

    this.stored.push(newEvent);
  }

  onChatUpdated = () => {
    if (this.isInvalidate) {
      this.discardOldData();

      this.drawnTraces.clearLayers();
      this.drawData();

      this.isInvalidate = false;
    }
  }


  private drawData() {
    const isTouchDev = isTouchDevice();

    var split = MACHINA_TRACKER_MAX_TIME / 4;
    var now = new Date().getTime();

    this.stored.forEach(action => {

      const ageBucket = Math.min(Math.floor((now - action.time) / split), 4 - 1);

      const position = action.latlng;
      const title = isTouchDev ? '' : ago(action.time, now) + ' ago';
      const icon = this.icon;
      const opacity = 1 - MACHINA_TRACKER_AGE_OPACITY * ageBucket;

      const marker = L.marker(position, { icon, opacity, title });
      window.registerMarkerForOMS(marker);

      marker.addTo(this.drawnTraces);
    });
  }
}
