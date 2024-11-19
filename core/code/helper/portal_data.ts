import { IITCr } from "../IITC";

interface LinkInOut {
    in: LinkGUID[];
    out: LinkGUID[];
}

export const getPortalLinks = (guid: PortalGUID): LinkInOut => {

    const links: LinkInOut = { in: [], out: [] };

    $.each(window.links, (linkGuid: LinkGUID, link) => {
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
    return IITCr.fields.getByPortal(guid).map(f => f.options.guid);
}


export const getPortalFieldsCount = (guid: PortalGUID): number => {
    const fields = getPortalFields(guid);
    return fields.length;
}
