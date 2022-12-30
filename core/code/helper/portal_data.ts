export const getPortalLinks = (guid: PortalGUID): { in: LinkGUID[], out: LinkGUID[] } => {

    const links = { in: [], out: [] };

    $.each(window.links, (linkGuid, link) => {
        const data = link.options.data;

        if (data.oGuid === guid) {
            links.out.push(linkGuid);
        }
        if (data.dGuid === guid) {
            links.in.push(linkGuid);
        }
    });

    return links;
}


export const getPortalLinksCount = (guid: PortalGUID): number => {
    const links = getPortalLinks(guid);
    return links.in.length + links.out.length;
}


/**
 * search through the fields for all that reference a portal
 */
export const getPortalFields = (guid: PortalGUID): FieldGUID[] => {
    const fields = [];

    $.each(window.fields, (g, f) => {
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
