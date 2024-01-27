import { WebLink } from "../../helper/web_links";
import { PortalInfo } from "../../portal/portal_info";
import { dialog } from "../dialog";
import { toast } from "../toast";


export const sharePortalDialog = (portal: PortalInfo): void => {

    const ll = portal.getLocation();

    const html = $("<div>", { class: "portalweblinks" }).append(
        $("<p>").append(
            $("<span>", { text: "Portal", class: "title" }),
            createLink("Intel", WebLink.intel(portal)),
            createLink("Ingress", WebLink.scanner(portal)),
            createLink("Location", `${ll.lat}, ${ll.lng}`, "").on("click", () => copy(`${ll.lat}, ${ll.lng}`))
        ),
        $("<p>").append(
            $("<span>", { text: "Map", class: "title" }),
            createLink("Google Maps", WebLink.google(portal)),
            createLink("OSM", WebLink.osm(portal)),
            createLink("Bing Maps", WebLink.bing(portal)),
            $("<div>", { id: "qrcode" })
        )
    );

    dialog({
        id: "portallink",
        title: portal.title,
        html,
        position: { my: "right-30 top+20", at: "left top", of: "#sidebar2" }
    });

    // ($("#qrcode", mdia) as any).qrcode({ text: `GEO:${ll.lat},${ll.lng}` });
}


const createLink = (name: string, link: string, realLink?: string): JQuery => {

    const sLink = link.replace(/^https:\/\//i, "");

    return $("<div>", { class: "alink" }).append(
        $("<span>", { text: name }),
        $("<a>", { href: realLink || link, text: sLink, target: "blank" }),
        $("<button>", { title: "copy", click: () => copy(link) })
    )
}


const copy = (text: string): Promise<void> => {
    toast("copied to clipboard");
    $("#dialog-portallink").dialog("close");

    return navigator.clipboard.writeText(text);
}


