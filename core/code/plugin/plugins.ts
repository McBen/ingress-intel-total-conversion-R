// import { PluginYandexMaps } from "./basemaps/basemap-yandex";
import { PluginBingMaps } from "./basemaps/basemap_bing";
import { PluginBlankMaps } from "./basemaps/basemap_blank";
import { PluginGaodeMap } from "./basemaps/basemap_gaode";
import { PluginGrayGoolgleMap } from "./basemaps/basemap_google_gray";
import { PluginKartverketMaps } from "./basemaps/basemap_kartverket";
import { PluginOSM } from "./basemaps/basemap_openstreetmap";
import { PluginStamenMaps } from "./basemaps/basemap_stamen";
import { PluginHighlightInactive } from "./highlighter/forgotten";
import { PluginHidePortalOwnership } from "./highlighter/highlight_hide_team";
import { PluginHighlightMissingReso } from "./highlighter/missing_resonators";
import { PluginHighlightNeedRecharge } from "./highlighter/needs_recharge";
import { PluginHighlightPortalHistory } from "./highlighter/portal_history";
import { PluginManager } from "./plugin_manager";

export const registerPlugins = (manager: PluginManager): void => {

    // Basemaps
    manager.add(new PluginBingMaps());
    // manager.add(new PluginYandexMaps()); // TODO: Yandex not available; need api key
    manager.add(new PluginBlankMaps());
    manager.add(new PluginOSM());
    manager.add(new PluginGrayGoolgleMap());
    manager.add(new PluginGaodeMap());
    manager.add(new PluginKartverketMaps());
    manager.add(new PluginStamenMaps());

    // Highlighters
    manager.add(new PluginHighlightPortalHistory());
    manager.add(new PluginHighlightInactive());
    manager.add(new PluginHighlightNeedRecharge());
    manager.add(new PluginHighlightMissingReso());
    manager.add(new PluginHidePortalOwnership());


}