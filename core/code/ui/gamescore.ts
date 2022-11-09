import { MINUTES } from "../helper/times";
import { Log, LogApp } from "../helper/log_apps";
import { idle } from "../map/idle";
import { digits } from "../utils_misc";
import { postAjax } from "../helper/send_request";
const log = Log(LogApp.Score);


const REFRESH_GAME_SCORE = 15 * MINUTES;

type GameScoreResult = {
    error?: string
    result?: [string, string];
}

export const updateGameScore = () => {
    // FIXME for some reason we have to do this call in next timeslice
    // else the ajax is not send (or the callback is never called)
    // the same is done original iitc code for another reason
    window.setTimeout(() => RequestGameScore(), 1);
    RequestGameScore();
}


const RequestGameScore = () => {
    if (idle.isIdle()) {
        window.setTimeout(RequestGameScore, REFRESH_GAME_SCORE);
        return;
    }

    postAjax("getGameScore", {},
        (data: GameScoreResult) => {
            processGameScore(data);
            window.setTimeout(RequestGameScore, REFRESH_GAME_SCORE);
        });
}


const processGameScore = (data?: GameScoreResult): void => {
    if (!data || !data.result) {
        log.warn("game score failed to load - unknown reason");
        return;
    }

    if (data.error) {
        log.warn(`game score failed to load: ${data.error}`);
        return;
    }

    redrawScore(parseInt(data.result[0]), parseInt(data.result[1]));
}


const redrawScore = (score_enl: number, score_res: number): void => {
    const total_score = score_res + score_enl;
    let res_percent = score_res / total_score * 100;
    let enl_percent = score_enl / total_score * 100;
    if (total_score === 0) {
        res_percent = 50;
        enl_percent = 50;
    }
    const res_string = digits(score_res);
    const enl_string = digits(score_enl);
    const rs = `<span class="res" style="width:${res_percent}%;">${Math.round(res_percent)}%&nbsp;</span>`;
    const es = `<span class="enl" style="width:${enl_percent}%;">&nbsp;${Math.round(enl_percent)}%</span>`;
    $("#gamestat").html(rs + es);

    $("#gamestat").attr("title", "Resistance:\t" + res_string + " MindUnits\nEnlightened:\t" + enl_string + " MindUnits");
}
