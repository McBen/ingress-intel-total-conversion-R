import { FACTION, teamStr2Faction } from "../constants";

export class Player {

    readonly team: FACTION;
    readonly level: number;
    readonly name: string;

    constructor() {
        if (this.isLoggedIn()) {
            this.team = teamStr2Faction(PLAYER.team);
            this.level = PLAYER.verified_level;
            this.name = PLAYER.nickname;
        }
    }

    isLoggedIn(): boolean {
        return PLAYER && !!PLAYER.nickname;
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

