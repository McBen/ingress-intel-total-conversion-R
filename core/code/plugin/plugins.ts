// import { PluginYandexMaps } from "./basemaps/basemap-yandex";
import { PluginBingMaps } from "./basemaps/basemap_bing";
import { PluginManager } from "./plugin_manager";

export const registerPlugins = (manager: PluginManager): void => {

    manager.add(new PluginBingMaps());
    // manager.add(new PluginYandexMaps()); // TODO: Yandex not available; need api key
}