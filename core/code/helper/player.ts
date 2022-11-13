import { FACTION } from "../constants";

export class Player {

    readonly team: FACTION;
    readonly level: number;
    readonly name: string;

    constructor() {
        if (this.isLoggedIn()) {
            this.team = this.teamStr2Faction(PLAYER.team);
            this.level = PLAYER.verified_level;
            this.name = PLAYER.nickname;
        }
    }

    private teamStr2Faction(name: "ENLIGHTENED" | "RESISTANCE"): FACTION {
        if (name === "RESISTANCE") return FACTION.RES;
        return FACTION.ENL;
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

