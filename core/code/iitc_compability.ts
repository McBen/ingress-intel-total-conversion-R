// Export functions for old IITC-Plugins
import { alert, dialog } from "./ui/dialog";


globalThis.alert = alert as any;
globalThis.dialog = dialog;
