export class Links {
    public all: Map<LinkGUID, IITC.Link>;
    private oldObject?: Record<string, IITC.Link>;

    constructor() {
        this.all = new Map();
    }

    get(guid: LinkGUID): IITC.Link | undefined {
        return this.all.get(guid);
    }

    add(link: IITC.Link) {
        this.all.set(link.options.guid, link);
        this.oldObject = undefined;
    }

    remove(guid: LinkGUID): IITC.Link | undefined {
        const oldLink = this.all.get(guid);
        if (oldLink) {
            this.all.delete(guid);
            this.oldObject = undefined;
            return oldLink
        }
        return;
    }

    deleteIf(condition: (link: IITC.Link) => boolean) {
        const entriesArray = [...this.all.entries()];
        const filteredEntries = entriesArray.filter(([_, link]) => !condition(link));
        this.all = new Map<LinkGUID, IITC.Link>(filteredEntries);
        this.oldObject = undefined;
    }


    getByPortal(guid: PortalGUID): { in: IITC.Link[]; out: IITC.Link[]; } {
        const links = [...this.all.values()];
        const l_in = links.filter(l => l.options.data.dGuid === guid);
        const l_out = links.filter(l => l.options.data.oGuid === guid);

        return { in: l_in, out: l_out };
    }

    /**
     * Links with atleast one Vertex in area
     */
    getInBounds(bounds: L.LatLngBounds): IITC.Link[] {
        const links = [...this.all.values()];
        return links.filter(link => {
            const points = link.getLatLngs();
            return points.some(p => bounds.contains(p));
        });
    }

    toOldObject(): Record<string, IITC.Link> {
        if (!this.oldObject) {
            console.warn("window.links getter has bad performace. Better use IITCr.links.get(guid)");
            // console.trace("window.links getter");
            this.oldObject = Object.fromEntries(this.all);
        }
        return this.oldObject;
    }

}
