export const MILLISECONDS = 1;
export const SECONDS = 1000;
export const MINUTES = 60 * 1000;
export const HOURS = 60 * 60 * 1000;
export const DAYS = 24 * 60 * 60 * 1000;

/**
 * seconds to "mm:ss"
 */
export const formatMinutes = (sec: number): string => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    sec = sec % 60;

    let time = hours.toString() + ":";
    time += zeroPad(minutes);
    time += ":";
    time += zeroPad(sec);
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


const zeroPad = (value: number): string => {
    if (value < 10) return `0${value}`;
    else return value.toString();
}