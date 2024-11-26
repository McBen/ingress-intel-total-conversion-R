export class Links {
    public all: IITC.Link[];
    private oldObject?: Record<string, IITC.Link>;

    constructor() {
        this.all = [];
    }

    get(guid: LinkGUID): IITC.Link | undefined {
        return this.all.find(f => f.options.guid === guid);
    }

    add(link: IITC.Link) {
        this.all.push(link);
        this.oldObject = undefined;
    }

    remove(guid: LinkGUID): IITC.Link | undefined {
        const index = this.all.findIndex(f => f.options.guid === guid);
        if (index !== -1) {
            this.oldObject = undefined;
            return this.all.splice(index, 1)[0];
        }
        return;
    }


    getByPortal(guid: PortalGUID): { in: IITC.Link[]; out: IITC.Link[]; } {
        const l_in = this.all.filter(l => l.options.data.dGuid === guid);
        const l_out = this.all.filter(l => l.options.data.oGuid === guid);

        return { in: l_in, out: l_out };
    }

    /**
     * Links with atleast one Vertex in area
     */
    getInBounds(bounds: L.LatLngBounds): IITC.Link[] {
        return this.all.filter(link => {
            const points = link.getLatLngs();
            return points.some(p => bounds.contains(p));
        });
    }


    toOldObject(): Record<string, IITC.Link> {
        if (!this.oldObject) {
            console.warn("window.links getter has bad performace. Better use IITCr.links.get(guid)");
            // console.trace("window.links getter");

            const result: Record<string, IITC.Link> = {};
            this.all.forEach(f => result[f.options.guid] = f);
            this.oldObject = result;
        }
        return this.oldObject;;
    }
}
