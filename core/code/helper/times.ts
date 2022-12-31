export const MILLISECONDS = 1;
export const SECONDS = 1000;
export const MINUTES = 60 * 1000;
export const HOURS = 60 * 60 * 1000;
export const DAYS = 24 * 60 * 60 * 1000;


export const zeroPad = (num: number, pad: number = 2): string => {
    const numStr = num.toString();
    const zeros = Math.max(0, pad - numStr.length);
    return "0".repeat(zeros) + numStr;
}


/**
 * seconds to "mm:ss"
 */
export const formatMinutes = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;

    let time = hours.toString() + ":";
    time += zeroPad(minutes);
    time += ":";
    time += zeroPad(seconds);
    return time;
}

/**
 * Date => "hh:00"
 */
export const formatHours = (time: Date): string => {
    return zeroPad(time.getHours()) + ":00";
}

/**
 * Date => "DD.MM hh:00"
 */
export const formatDayHours = (time: Date): string => {
    return `${zeroPad(time.getDate())}.${zeroPad(time.getMonth() + 1)} ${zeroPad(time.getHours())}:00`;
}


/**
 * converts javascript timestamps to HH:mm:ss format if it was today;
 * otherwise it returns YYYY-MM-DD
 */
export const unixTimeToString = (time: string | number, full?: boolean): string | undefined => {
    if (!time) return;
    const d = new Date(typeof time === "string" ? parseInt(time) : time);

    const timeStr = d.toLocaleTimeString();
    const date = `${d.getFullYear()}-${zeroPad(d.getMonth() + 1)}-${zeroPad(d.getDate())}`;
    if (full !== undefined && full) return date + " " + timeStr;
    if (d.toDateString() === new Date().toDateString()) {
        return timeStr;
    } else {
        return date;
    }
}


/**
 * converts a javascript time to a precise date and time (optionally with millisecond precision)
 * formatted in ISO-style YYYY-MM-DD hh:mm:ss.mmm - but using local timezone
 */
export const unixTimeToDateTimeString = (time: string | number, millisecond?: boolean): string | null => {
    if (!time) return null;
    const d = new Date(typeof time === "string" ? parseInt(time) : time);
    return d.getFullYear() + "-" + zeroPad(d.getMonth() + 1) + "-" + zeroPad(d.getDate())
        + " "
        + zeroPad(d.getHours()) + ":" + zeroPad(d.getMinutes()) + ":" + zeroPad(d.getSeconds()) + (millisecond ? "." + zeroPad(d.getMilliseconds(), 3) : "");
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
