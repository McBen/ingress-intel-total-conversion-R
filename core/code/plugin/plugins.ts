// import { PluginYandexMaps } from "./basemaps/basemap-yandex";
import { PluginBingMaps } from "./basemaps/basemap_bing";
import { PluginBlankMaps } from "./basemaps/basemap_blank";
import { PluginGrayGoolgleMap } from "./basemaps/basemap_google_gray";
import { PluginOSM } from "./basemaps/basemap_openstreetmap";
import { PluginManager } from "./plugin_manager";

export const registerPlugins = (manager: PluginManager): void => {

    // Basemaps
    manager.add(new PluginBingMaps());
    // manager.add(new PluginYandexMaps()); // TODO: Yandex not available; need api key
    manager.add(new PluginBlankMaps());
    manager.add(new PluginOSM());
    manager.add(new PluginGrayGoolgleMap());
}