import { PluginManager } from "../plugin_manager";
import { PluginHighlightInactive } from "./forgotten";
import { PluginHidePortalOwnership } from "./hide_team";
import { PluginHighlightHighLevel } from "./high_level";
import { PluginHighlightLevelColor } from "./level_color";
import { PluginHighlightMissingReso } from "./missing_resonators";
import { PluginHighlightNeedRecharge } from "./needs_recharge";
import { PluginHighlightOrnaments } from "./ornaments";
import { PluginHighlightMyLevel } from "./portals_my_level";
import { PluginHighlightPortalHistory } from "./portal_history";
import { PluginHighlightWeakness } from "./weakness";


export const register = (manager: PluginManager): void => {
    manager.add(new PluginHighlightPortalHistory());
    manager.add(new PluginHighlightInactive());
    manager.add(new PluginHighlightNeedRecharge());
    manager.add(new PluginHighlightMissingReso());
    manager.add(new PluginHidePortalOwnership());
    manager.add(new PluginHighlightHighLevel());
    manager.add(new PluginHighlightLevelColor());
    manager.add(new PluginHighlightMyLevel());
    manager.add(new PluginHighlightWeakness());
    manager.add(new PluginHighlightOrnaments());
}
