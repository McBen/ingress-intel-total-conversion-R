import { IITCr } from "../IITC";

interface LinkInOut {
    in: LinkGUID[];
    out: LinkGUID[];
}

export const getPortalLinks = (guid: PortalGUID): LinkInOut => {

    const links = IITCr.links.getByPortal(guid);

    return {
        in: links.in.map(l => l.options.guid),
        out: links.out.map(l => l.options.guid)
    }
}


export const getPortalLinksCount = (guid: PortalGUID): number => {
    const links = IITCr.links.getByPortal(guid);
    return links.in.length + links.out.length;
}


/**
 * search through the fields for all that reference a portal
 */
export const getPortalFields = (guid: PortalGUID): FieldGUID[] => {
    const fields: FieldGUID[] = [];

    $.each(window.fields, (g: FieldGUID, f) => {
        const d = f.options.data;

        if (d.points[0].guid === guid
            || d.points[1].guid === guid
            || d.points[2].guid === guid) {

            fields.push(g);
        }
    });

    return fields;
}


export const getPortalFieldsCount = (guid: PortalGUID): number => {
    const fields = getPortalFields(guid);
    return fields.length;
}
