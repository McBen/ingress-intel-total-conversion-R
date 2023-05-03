import { hooks } from "../helper/hooks";
import { postAjax } from "../helper/send_request";
import { DataCache } from "../map/data_cache";
import { renderPortalDetails } from "./portal_display";
import { PortalInfoDetailed } from "./portal_info_detailed";


/**
 * code to retrieve the portal detail data from the servers
 */
export class PortalDetails {
    private cache: DataCache<PortalGUID, PortalInfoDetailed>;
    private requestQueue: Map<PortalGUID, Promise<PortalInfoDetailed>>;

    constructor() {
        this.cache = new DataCache();
        this.cache.startExpireInterval(20);

        this.requestQueue = new Map();
    }

    get(guid: PortalGUID): PortalInfoDetailed | undefined {
        return this.cache.get(guid);
    }


    isFresh(guid: PortalGUID): boolean {
        return this.cache.isFresh(guid);
    }


    request(guid: PortalGUID): Promise<PortalInfoDetailed> {
        if (!this.requestQueue.has(guid)) {

            const newRequest = this.doRequest(guid).finally(() => { this.requestQueue.delete(guid); })
            this.requestQueue.set(guid, newRequest);
            return newRequest;
        }

        return this.requestQueue.get(guid);
    }


    private doRequest(guid: PortalGUID): Promise<PortalInfoDetailed> {
        const promise = new Promise<PortalInfoDetailed>((resolve, reject) => {
            postAjax("getPortalDetails", { guid },
                data => {

                    if (data && data.error === "RETRY") return this.request(guid);
                    if (!data || data.error || !data.result) return reject();

                    const portal = new PortalInfoDetailed(data.result as IITC.EntityPortalDetailed);
                    this.cache.store(guid, portal);

                    // TODO: move to hook handler
                    if (guid === selectedPortal) {
                        renderPortalDetails(guid);
                    }

                    // NOTE: we dropped "details"
                    const oldEntData = [guid, portal.timestamp2, data.result];
                    hooks.trigger("portalDetailLoaded", {
                        guid, success: true,
                        portal,
                        /* for old plugins :*/ details: portal,
                        /* for old plugins :*/ ent: oldEntData
                    });
                    resolve(portal);
                },
                () => {
                    hooks.trigger("portalDetailLoaded", { guid, success: false });
                    reject();
                }
            );
        })

        return promise;
    }
}

export const portalDetail = new PortalDetails();