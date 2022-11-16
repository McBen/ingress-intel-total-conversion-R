import L from "leaflet";
import { dialog } from "./ui/dialog";

/**
 * retrieves parameter from the URL?query=string.
 */
export const getURLParam = (param: string): string => {
    const items = window.location.search.substr(1).split("&");

    for (let i = 0; i < items.length; i++) {
        const item = items[i].split("=");

        if (item[0] == param) {
            const val = item.length == 1 ? "" : decodeURIComponent(item[1].replace(/\+/g, " "));
            return val;
        }
    }

    return "";
}



/**
 * read cookie by name.
 * http://stackoverflow.com/a/5639455/1684530 by cwolves
 */
export const readCookie = (name: string): string => {
    let C;
    const c = document.cookie.split("; ");
    const cookies = {};
    for (let i = c.length - 1; i >= 0; i--) {
        C = c[i].split("=");
        cookies[C[0]] = decodeURI(C[1]);
    }
    return cookies[name];
}



/**
 * Store a cookie
 * @param {number} forcedExpireTime days till cookie expires
 */
export const writeCookie = (name: string, value: string, forcedExpireTime?: number): void => {

    const DEFAULT_COOKIE_EXPIRE_DAYS = 365;
    const time = (forcedExpireTime ?? DEFAULT_COOKIE_EXPIRE_DAYS) * 24 * 60 * 60 * 1000;
    const expires = "; expires=" + new Date(Date.now() + time).toUTCString();

    document.cookie = name + "=" + value + expires + "; path=/;SameSite=Strict";
}



export const eraseCookie = (name: string): void => {
    document.cookie = name + "=; expires=Thu, 1 Jan 1970 00:00:00 GMT; path=/";
}



/**
 * add thousand separators to given number.
 * http://stackoverflow.com/a/1990590/1684530 by Doug Neiner.
 */
export const digits = (d: number | string): string => {
    // U+2009 - Thin Space. Recommended for use as a thousands separator...
    // https://en.wikipedia.org/wiki/Space_(punctuation)#Table_of_spaces
    return d.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1&#8201;");
}


export const zeroPad = (num: number, pad: number): string => {
    const numStr = num.toString();
    const zeros = pad - numStr.length;
    return Array(zeros > 0 ? zeros + 1 : 0).join("0") + numStr;
}


/**
 * converts javascript timestamps to HH:mm:ss format if it was today;
 * otherwise it returns YYYY-MM-DD
 */
export const unixTimeToString = (time: string | number, full?: boolean): string | undefined => {
    if (!time) return;
    const d = new Date(typeof time === "string" ? parseInt(time) : time);

    const timeStr = d.toLocaleTimeString();
    const date = `${d.getFullYear()}-${zeroPad(d.getMonth() + 1, 2)}-${zeroPad(d.getDate(), 2)}`;
    if (typeof full !== "undefined" && full) return date + " " + timeStr;
    if (d.toDateString() === new Date().toDateString()) {
        return timeStr;
    } else {
        return date;
    }
}


// converts a javascript time to a precise date and time (optionally with millisecond precision)
// formatted in ISO-style YYYY-MM-DD hh:mm:ss.mmm - but using local timezone
export const unixTimeToDateTimeString = (time: string | number, millisecond?: boolean): string | null => {
    if (!time) return null;
    const d = new Date(typeof time === "string" ? parseInt(time) : time);
    return d.getFullYear() + "-" + zeroPad(d.getMonth() + 1, 2) + "-" + zeroPad(d.getDate(), 2)
        + " " + zeroPad(d.getHours(), 2) + ":" + zeroPad(d.getMinutes(), 2) + ":" + zeroPad(d.getSeconds(), 2) + (millisecond ? "." + zeroPad(d.getMilliseconds(), 3) : "");
}


export const unixTimeToHHmm = (time: string | number): string | null => {
    if (!time) return null;
    const d = new Date(typeof time === "string" ? parseInt(time) : time);
    let h = d.getHours().toString();
    h = h.length === 1 ? "0" + h : h;
    let s = d.getMinutes().toString();
    s = s.length === 1 ? "0" + s : s;
    return h + ":" + s;
}


export const formatInterval = (seconds: number, maxTerms?: number): string => {

    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let terms = [];
    if (d > 0) terms.push(d + "d");
    if (h > 0) terms.push(h + "h");
    if (m > 0) terms.push(m + "m");
    if (s > 0 || terms.length === 0) terms.push(s + "s");

    if (maxTerms) terms = terms.slice(0, maxTerms);

    return terms.join(" ");
}


export const showPortalPosLinks = (lat, lng, name) => {
    const encoded_name = encodeURIComponent(name);
    const qrcode = '<div id="qrcode"></div>';
    const script = "<script>$('#qrcode').qrcode({text:'GEO:" + lat + "," + lng + "'});</script>";
    const gmaps = '<a href="https://maps.google.com/maps?ll=' + lat + "," + lng + "&q=" + lat + "," + lng + "%20(" + encoded_name + ')">Google Maps</a>';
    const bingmaps = '<a href="https://www.bing.com/maps/?v=2&cp=' + lat + "~" + lng + "&lvl=16&sp=Point." + lat + "_" + lng + "_" + encoded_name + '___">Bing Maps</a>';
    const osm = '<a href="https://www.openstreetmap.org/?mlat=' + lat + "&mlon=" + lng + '&zoom=16">OpenStreetMap</a>';
    const latLng = "<span>" + lat + "," + lng + "</span>";
    dialog({
        html: '<div style="text-align: center;">' + qrcode + script + gmaps + "; " + bingmaps + "; " + osm + "<br />" + latLng + "</div>",
        title: name,
        id: "poslinks"
    });
}

export const isTouchDevice = (): boolean => {
    return "ontouchstart" in window // works on most browsers
        || "onmsgesturechange" in window; // works on ie10
}


/**
 * returns number of pixels left to scroll down before reaching the
 * bottom. Works similar to the native scrollTop function.
 */
export const scrollBottom = (element: string | JQuery): number => {
    if (typeof element === "string") element = $(element);
    return element.get(0).scrollHeight - element.innerHeight() - element.scrollTop();
}


/**
 * converts given text with newlines (\n) and tabs (\t) to a HTML table automatically.
 */
export const convertTextToTableMagic = (text: string): string => {
    // check if it should be converted to a table
    if (!/\t/.test(text)) return text.replace(/\n/g, "<br>");

    const data = [];
    let columnCount = 0;

    // parse data
    const rows = text.split("\n");
    $.each(rows, function (i, row) {
        data[i] = row.split("\t");
        if (data[i].length > columnCount) columnCount = data[i].length;
    });

    // build the table
    let table = "<table>";
    $.each(data, function (i, row) {
        table += "<tr>";
        $.each(data[i], function (k, cell) {
            let attributes = "";
            if (k === 0 && data[i].length < columnCount) {
                attributes = ' colspan="' + (columnCount - data[i].length + 1) + '"';
            }
            table += "<td" + attributes + ">" + cell + "</td>";
        });
        table += "</tr>";
    });
    table += "</table>";
    return table;
}


/**
 * escape a javascript string, so quotes and backslashes are escaped with a backslash
 * (for strings passed as parameters to html onclick="..." for example)
 */
export const escapeJavascriptString = (str: string): string => {
    return (str + "").replace(/[\\"']/g, "\\$&");
}

/**
 * escape special characters, such as tags
 */
export const escapeHtmlSpecialChars = (str: string): string => {
    const div = document.createElement("div");
    const text = document.createTextNode(str);
    div.appendChild(text);
    return div.innerHTML;
}


export const prettyEnergy = (nrg: number): string => {
    return nrg > 1000 ? Math.round(nrg / 1000).toString() + " k" : nrg.toString();
}


export const uniqueArray = <T>(array: T[]): T[] => {
    return [...new Set(array)];
}


type genFourEnty = [string, string, string?] | undefined;
export const genFourColumnTable = (blocks: genFourEnty[]): string => {
    const lines = blocks.map((detail, index) => {
        if (!detail) return "";
        const title = detail[2] ? ` title="${escapeHtmlSpecialChars(detail[2])}"` : "";
        if (index % 2 === 0) {
            return `<tr><td${title}>${detail[1]}</td><th${title}>${detail[0]}</th>`;
        } else {
            return `    <th${title}>${detail[0]}</th><td${title}>${detail[1]}</td></tr>`;
        }
    }).join("");
    return lines;
}


const clamp = (n: number, max: number, min: number): number => {
    if (n === 0) { return 0; }
    return n > 0 ? Math.min(n, max) : Math.max(n, min);
}

const MAX_LATITUDE = 85.051128; // L.Projection.SphericalMercator.MAX_LATITUDE
export const clampLatLng = (latlng: L.LatLng): [number, number] => {
    // Ingress accepts requests only for this range
    return [
        clamp(latlng.lat, MAX_LATITUDE, -MAX_LATITUDE),
        clamp(latlng.lng, 179.999999, -180)
    ];
}


export const clampLatLngBounds = (bounds: L.LatLngBounds): L.LatLngBounds => {
    const SW = bounds.getSouthWest();
    const NE = bounds.getNorthEast();
    return L.latLngBounds(clampLatLng(SW), clampLatLng(NE));
}


export interface makePermalinkOptions {
    fullURL: boolean; /** Use to make absolute fully qualified URL (default: relative link). */
    includeMapView: boolean;  /** Use to add zoom level and latlng of current map center. */
}

/**
 * Makes the permalink for the portal with specified latlng, possibly including current map view.
 * Portal latlng can be omitted to create mapview-only permalink.
 */
export const makePermalink = (latlng?: L.LatLng, options?: Partial<makePermalinkOptions>): string => {
    options = options || {};

    const args = [];
    if (!latlng || options.includeMapView) {
        const round = (l: number): number => { // ensures that lat,lng are with same precision as in stock intel permalinks
            return Math.floor(l * 1e6) * 1e-6;
        };
        const center = window.map.getCenter();
        args.push(
            "ll=" + [round(center.lat), round(center.lng)].join(","),
            "z=" + window.map.getZoom().toFixed(0)
        );
    }
    if (latlng) {
        args.push(`pll=${latlng.lat},${latlng.lng}`);
    }
    const url = options.fullURL ? document.baseURI : "/";
    return url + "?" + args.join("&");
};
