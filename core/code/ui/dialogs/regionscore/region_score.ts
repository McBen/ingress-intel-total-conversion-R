import { FACTION } from "../../../constants";
import { HOURS } from "../../../helper/times";

export const CP_COUNT = 35;
export const CP_DURATION = 5 * HOURS;
export const CYCLE_DURATION = CP_DURATION * CP_COUNT;


export interface ServerResult {
    topAgents: { team: string, nick: string }[];
    regionName: string;
    gameScore: [ENL: string, RES: string];
    scoreHistory: [string, string, string][];
}


export class RegionScore {

    private gameScore: [ENL: string, RES: string];
    public regionName: string;
    public topAgents: { team: string, nick: string }[];

    private median: [number, number, number];
    private checkpoints: [ENL: number, RES: number][];
    private cycleStartTime: Date;


    constructor(serverResult: ServerResult) {
        this.topAgents = serverResult.topAgents;
        this.regionName = serverResult.regionName;
        this.gameScore = serverResult.gameScore;

        this.median = [-1, -1, -1];

        this.checkpoints = [];

        serverResult.scoreHistory.forEach(cp => {
            this.checkpoints[parseInt(cp[0])] = [parseInt(cp[1]), parseInt(cp[2])];
        });

        this.cycleStartTime = new Date(Math.floor(Date.now() / CYCLE_DURATION) * CYCLE_DURATION);
    }

    hasNoTopAgents(): boolean {
        return this.topAgents.length === 0;
    }

    getAvgScore(faction: FACTION): number {
        return parseInt(this.gameScore[faction === FACTION.ENL ? 0 : 1]);
    }

    getAvgScoreMax(): number {
        return Math.max(this.getAvgScore(FACTION.ENL), this.getAvgScore(FACTION.RES), 1);
    }

    getCPScore(cp: number): [number, number] {
        return this.checkpoints[cp];
    }

    getScoreMax(min_value = 0): number {
        let max = min_value;
        for (let i = 1; i < this.checkpoints.length; i++) {
            const cp = this.checkpoints[i];
            max = Math.max(max, cp[0], cp[1]);
        }
        return max;
    }

    getCPSum(): [number, number] {
        const sums: [number, number] = [0, 0];
        for (let i = 1; i < this.checkpoints.length; i++) {
            sums[0] += this.checkpoints[i][0];
            sums[1] += this.checkpoints[i][1];
        }

        return sums;
    }


    getAvgScoreAtCP(faction: FACTION.RES | FACTION.ENL, cp_index: number): number {
        const index = faction === FACTION.RES ? 1 : 0;

        let score = 0;
        let count = 0;
        const cp_length = Math.min(cp_index, this.checkpoints.length);

        for (let i = 1; i <= cp_length; i++) {
            if (this.checkpoints[i] !== undefined) {
                score += this.checkpoints[i][index];
                count++;
            }
        }

        if (count < cp_index) {
            score += this.getScoreMedian(faction) * (cp_index - count);
        }

        return Math.floor(score / cp_index);
    }


    private getScoreMedian(faction: FACTION.RES | FACTION.ENL): number {
        if (this.median[faction] < 0) {
            const index = faction === FACTION.RES ? 1 : 0;
            const values = this.checkpoints.map(cp => cp[index])
                .filter(score => score !== undefined);
            this.median[faction] = this.findMedian(values);
        }

        return this.median[faction];
    }

    private findMedian(values: number[]): number {
        if (values.length === 0) return 0;

        values = values.sort();
        const mid = Math.floor((values.length - 1) / 2);
        return values[mid];
    }

    getLastCP(): number {
        if (this.checkpoints.length === 0) return 0;
        return this.checkpoints.length - 1;
    }

    getCycleEnd() {
        return this.getCheckpointEnd(CP_COUNT);
    }

    getCheckpointEnd(cp: number): Date {
        return new Date(this.cycleStartTime.getTime() + CP_DURATION * cp);
    }
}


