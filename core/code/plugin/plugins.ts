// import { PluginYandexMaps } from "./basemaps/basemap-yandex";
import { PluginBingMaps } from "./basemaps/basemap_bing";
import { PluginBlankMaps } from "./basemaps/basemap_blank";
import { PluginGaodeMap } from "./basemaps/basemap_gaode";
import { PluginGrayGoolgleMap } from "./basemaps/basemap_google_gray";
import { PluginKartverketMaps } from "./basemaps/basemap_kartverket";
import { PluginOSM } from "./basemaps/basemap_openstreetmap";
import { PluginStamenMaps } from "./basemaps/basemap_stamen";
import { register as registerHighlighters } from "./highlighter/_all";
import { PluginPortalLevelNumbers } from "./portal_level_numbers";
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
    manager.add(new PluginPortalLevelNumbers());

    // Highlighters
    registerHighlighters(manager);
}