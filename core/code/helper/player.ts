import { FACTION, teamStr2Faction } from "../constants";

export class Player {

    readonly team: FACTION;
    readonly level: number;
    readonly name: string;

    constructor() {
        if (this.isLoggedIn()) {
            this.team = teamStr2Faction(window.PLAYER.team);
            this.level = window.PLAYER.verified_level;
            this.name = window.PLAYER.nickname;
        }
    }

    isLoggedIn(): boolean {
        return window.PLAYER && !!window.PLAYER.nickname;
    }


    isTeam(faction: FACTION): boolean {
        return this.team === faction;
    }


    preferedTeamOrder(): [FACTION, FACTION] {
        return (this.team === FACTION.RES) ?
            [FACTION.RES, FACTION.ENL] : [FACTION.ENL, FACTION.RES];
    }


}

export const player = new Player();

