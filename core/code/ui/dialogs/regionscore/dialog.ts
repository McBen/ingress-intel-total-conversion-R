import { FACTION, FACTION_COLORS, FACTION_CSS, FACTION_NAMES } from "../../../constants";
import { convertTextToTableMagic, digits } from "../../../helper/utils_misc";
import { HistoryChart } from "./history_chart";
import { CP_COUNT, RegionScore, ServerResult } from "./region_score";
import { dialog } from "../../dialog";
import { player } from "../../../helper/player";
import { postAjax } from "../../../helper/send_request";
import { formatDayHours, formatHours, formatMinutes } from "../../../helper/times";


export class RegionScoreDialog {
    private mainDialog: JQuery;
    private regionScore: RegionScore;
    private timer: number | undefined;

    static showDialog(): void {
        const latLng = window.map.getCenter();

        const latE6 = Math.round(latLng.lat * 1e6);
        const lngE6 = Math.round(latLng.lng * 1e6);

        const regioDialog = new RegionScoreDialog();
        regioDialog.showRegion(latE6, lngE6);
    }

    static setup(): void { // TODO let it do it them self or do it in one place?
        /* 
           if (window.useAppPanes()) {
                app.addPane('regionScoreboard', 'Region scores', 'ic_action_view_as_list');
                addHook('paneChanged', function (pane) {
                    if (pane === 'regionScoreboard') {
                        showDialog();
                    } else if (mainDialog) {
                        mainDialog.remove();
                    }
                });
            } else {
                $('<a>')
                    .html('Region scores')
                    .attr('title', 'View regional scoreboard')
                    .click(showDialog)
                    .appendTo('#toolbox');
            }
            */
    }


    showRegion(latE6: number, lngE6: number): void {
        const text = "Loading regional scores...";
        if (window.useAppPanes()) {
            const style = "position: absolute; top: 0; width: 100%; max-width: 412px";
            this.mainDialog = $("<div>", { style }).html(text).appendTo(document.body);
        } else {
            this.mainDialog = dialog({
                title: "Region scores",
                html: text,
                width: 450,
                height: 340,
                closeCallback: () => this.onDialogClose()
            });
        }

        postAjax("getRegionScoreDetails", { latE6, lngE6 },
            data => this.onRequestSuccess(data),
            () => this.onRequestFailure());
    }

    onRequestFailure() {
        this.mainDialog.html("Failed to load region scores - try again");
    }

    onRequestSuccess(data: any) {
        if (data.result === undefined) {
            return this.onRequestFailure();
        }

        this.regionScore = new RegionScore(data.result as ServerResult);
        this.updateDialog(false);
        this.startTimer();
    }


    updateDialog(logscale: boolean): void {

        const chart = new HistoryChart().create(this.regionScore, logscale);

        this.mainDialog.html(
            '<div class="cellscore">' +
            "<b>Region scores for " + this.regionScore.regionName + "</b>" +
            '<div class="historychart">' + this.createResults() + chart + "</div>" +
            "<b>Checkpoint overview</b><div>" + this.createHistoryTable() + "</div>" +
            "<b>Top agents</b><div>" + this.createAgentTable() + "</div>" +
            "</div>" +
            this.createTimers());

        this.setupToolTips();

        const tooltip = this.createResultTooltip();
        $("#overview", this.mainDialog).tooltip({
            content: convertTextToTableMagic(tooltip)
        });

        $(".cellscore", this.mainDialog).accordion({
            header: "b",
            heightStyle: "fill"
        });

        $("input.logscale", this.mainDialog).on("change", (event: JQuery.ChangeEvent) => {
            const input = $(event.target);
            this.updateDialog(input.prop("checked") as boolean);
        });
    }


    setupToolTips() {
        const that = this;

        $("g.checkpoint", this.mainDialog).each(function (i, element) {
            const $element = $(element);

            const formatScore = (index: number, score_now: number[], score_last: number[]): string => {
                if (!score_now[index]) return "";
                let res = digits(score_now[index]);
                if (score_last && score_last[index]) {
                    const delta = score_now[index] - score_last[index];
                    res += "\t(";
                    if (delta > 0) res += "+";
                    res += digits(delta) + ")";
                }
                return res;
            }

            let tooltip: string = "";
            const cp = parseInt($element.attr("data-cp") as string);
            if (cp) {
                const score_now = that.regionScore.getCPScore(cp);
                const score_last = that.regionScore.getCPScore(cp - 1);
                const enl_str = score_now ? "\nEnl:\t" + formatScore(0, score_now, score_last) : "";
                const res_str = score_now ? "\nRes:\t" + formatScore(1, score_now, score_last) : "";

                const time = formatDayHours(that.regionScore.getCheckpointEnd(cp));
                tooltip = `CP:\t${cp}\t-\t${time}\n<hr>${enl_str}${res_str}`;
            }

            $element.tooltip({
                content: convertTextToTableMagic(tooltip),
                position: { my: "center bottom", at: "center top-10" },
                tooltipClass: "checkpointtooltip",
                show: 100
            });
        });
    }


    onDialogClose(): void {
        this.stopTimer();
    }


    createHistoryTable() {

        const invert = player.isTeam(FACTION.RES);
        const order = (a: string, b: string): string => {
            return invert ? b + a : a + b;
        }
        const enl = { class: FACTION_CSS[FACTION.ENL], name: FACTION_NAMES[FACTION.ENL] };
        const res = { class: FACTION_CSS[FACTION.RES], name: FACTION_NAMES[FACTION.RES] };

        let table = '<table class="checkpoint_table"><thead>' +
            "<tr><th>CP</th><th>Time</th>" + order("<th>" + enl.name + "</th>", "<th>" + res.name + "</th>") + "</tr>";

        const total = this.regionScore.getCPSum();
        table += '<tr class="cp_total"><th></th><th></th>' +
            order(
                '<th class="' + enl.class + '">' + digits(total[0]) + "</th>",
                '<th class="' + res.class + '">' + digits(total[1]) + "</th>"
            ) + "</tr></thead>";

        for (let cp = this.regionScore.getLastCP(); cp > 0; cp--) {
            const score = this.regionScore.getCPScore(cp);
            const class_e = score[0] > score[1] ? ' class="' + enl.class + '"' : "";
            const class_r = score[1] > score[0] ? ' class="' + res.class + '"' : "";

            table += "<tr>" +
                "<td>" + cp.toFixed(0) + "</td>" +
                "<td>" + formatDayHours(this.regionScore.getCheckpointEnd(cp)) + "</td>" +
                order(
                    "<td" + class_e + ">" + digits(score[0]) + "</td>",
                    "<td" + class_r + ">" + digits(score[1]) + "</td>"
                ) + "</tr>";
        }

        table += "</table>";
        return table;
    }


    createAgentTable() {
        let agentTable = "<table><tr><th>#</th><th>Agent</th></tr>";

        this.regionScore.topAgents.forEach((agent, index) => {
            agentTable += "<tr>" +
                "<td>" + (index + 1).toFixed() + "</td>" +
                '<td class="nickname ' + (agent.team === "RESISTANCE" ? "res" : "enl") + '">' + agent.nick + "</td></tr>";
        });

        if (this.regionScore.hasNoTopAgents()) {
            agentTable += '<tr><td colspan="2"><i>no top agents</i></td></tr>';
        }
        agentTable += "</table>";

        return agentTable;
    }


    createResults() {

        const maxAverage = this.regionScore.getAvgScoreMax();
        const order = player.preferedTeamOrder();

        let result = '<table id="overview" title="">';
        for (let t = 0; t < 2; t++) {
            const faction = order[t] as (FACTION.RES | FACTION.ENL);
            const team = FACTION_NAMES[faction];
            const teamClass = FACTION_CSS[faction];
            const teamCol = FACTION_COLORS[faction];
            const barSize = Math.round(this.regionScore.getAvgScore(faction) / maxAverage * 100).toFixed();
            result += '<tr><th class="' + teamClass + '">' + team + "</th>" +
                '<td class="' + teamClass + '">' + digits(this.regionScore.getAvgScore(faction)) + "</td>" +
                '<td style="width:100%"><div style="background:' + teamCol + "; width: " + barSize + "%; height: 1.3ex; border: 2px outset " + teamCol + '; margin-top: 2px"> </td>' +
                '<td class="' + teamClass + '"><small>( ' + digits(this.regionScore.getAvgScoreAtCP(faction, 35)) + " )</small></td>" +
                "</tr>";
        }

        return result + "</table>";
    }

    createResultTooltip() {

        const score_res = this.regionScore.getAvgScoreAtCP(FACTION.RES, CP_COUNT);
        const score_enl = this.regionScore.getAvgScoreAtCP(FACTION.ENL, CP_COUNT);
        const loosing_faction = score_res < score_enl ? FACTION.RES : FACTION.ENL;

        const order = (loosing_faction === FACTION.ENL ? [FACTION.RES, FACTION.ENL] : [FACTION.ENL, FACTION.RES]);

        const percentToString = (score: number, total: number): string => {
            if (total === 0) return "50%";
            const percent = Math.round(score / total * 10000) / 100;
            return `${percent}%`;
        }

        const currentScore = (): string => {
            let res = "Current:\n";
            const total = this.regionScore.getAvgScore(FACTION.RES) + this.regionScore.getAvgScore(FACTION.ENL);
            for (let t = 0; t < 2; t++) {
                const faction = order[t];
                const score = this.regionScore.getAvgScore(faction);
                res += FACTION_NAMES[faction] + "\t" +
                    digits(score) + "\t" +
                    percentToString(score, total) + "\n";
            }

            return res;
        }

        const estimatedScore = (): string => {
            let res = "<hr>Estimated:\n";
            const total = score_res + score_enl;
            for (let t = 0; t < 2; t++) {
                const faction = order[t] as (FACTION.RES | FACTION.ENL);
                const score = this.regionScore.getAvgScoreAtCP(faction, CP_COUNT);
                res += FACTION_NAMES[faction] + "\t" +
                    digits(score) + "\t" +
                    percentToString(score, total) + "\n";
            }

            return res;
        }

        const requiredScore = (): string => {
            let res = "";
            const required_mu = Math.abs(score_res - score_enl) * CP_COUNT + 1;
            res += "<hr>\n";
            res += FACTION_NAMES[loosing_faction] + " requires:\t" + digits(Math.ceil(required_mu)) + " \n";
            res += `Checkpoint(s) left:\t${CP_COUNT - this.regionScore.getLastCP()} \n`;

            return res;
        }

        return currentScore() + estimatedScore() + requiredScore();
    }


    createTimers(): string {
        const nextcp = this.regionScore.getCheckpointEnd(this.regionScore.getLastCP() + 1);
        const endcp = this.regionScore.getCycleEnd();

        return '<div class="checkpoint_timers"><table><tr>' +
            "<td>Next CP at: " + formatHours(nextcp) + ' (in <span id="cycletimer"></span>)</td>' +
            "<td>Cycle ends: " + formatDayHours(endcp) + "</td>" +
            "</tr></table></div>";
    }

    startTimer() {
        this.stopTimer();

        this.timer = window.setInterval(this.onTimer, 1000);
        this.onTimer();
    }

    stopTimer() {
        if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    onTimer = (): void => {
        const d = this.regionScore.getCheckpointEnd(this.regionScore.getLastCP() + 1).getTime() - (Date.now());
        $("#cycletimer", this.mainDialog).html(formatMinutes(Math.max(0, Math.floor(d / 1000))));
    }

}
