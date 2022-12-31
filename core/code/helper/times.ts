import { zeroPad } from "./utils_misc";

export const MILLISECONDS = 1;
export const SECONDS = 1000;
export const MINUTES = 60 * 1000;
export const HOURS = 60 * 60 * 1000;
export const DAYS = 24 * 60 * 60 * 1000;


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
