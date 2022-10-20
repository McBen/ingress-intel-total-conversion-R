/* eslint-disable unicorn/switch-case-braces */
/* eslint-disable max-classes-per-file */
import { FACTION } from "../constants";

export class PortalInfoBase {

    readonly guid: PortalGUID;
    readonly timestamp: number;
    readonly team: FACTION;
    readonly latE6: number;
    readonly lngE6: number;

    constructor(ent: IITC.EntityPortalBasic) {
        const data = ent[2];
        this.team = this.teamStr2Faction(data[1]);
        this.latE6 = data[2];
        this.lngE6 = data[3];
    }


    private teamStr2Faction(team: IITC.EntityTeam): FACTION {
        switch (team) {
            case "R": return FACTION.RES;
            case "E": return FACTION.ENL;
            default:
            case "N": return FACTION.none;
        }
    }
}


export class PortalInfo extends PortalInfoBase {

    readonly level: number;
    readonly health: number;
    readonly resCount: number;
    readonly image: string;
    readonly title: string;
    readonly ornaments: [];
    readonly mission: boolean;
    readonly mission50plus: boolean;
    readonly artifactBrief: null | [];
    readonly timestamp2: number;

    constructor(ent: IITC.EntityPortalOverview) {
        super(ent as unknown as IITC.EntityPortalBasic);

        const data = ent[2];
        this.level = data[4];
        this.health = data[5];
        this.resCount = data[6];
        this.image = data[7];
        this.title = data[8];
        this.ornaments = data[9];
        this.mission = data[10];
        this.mission50plus = data[11];
        this.artifactBrief = data[12];
        this.timestamp2 = data[13];
    }
}


export class PortalInfoDetailed extends PortalInfo {
    readonly mods: [null, null, null, null];
    readonly resonators: [];
    readonly owner: string;
    readonly artifactDetail: [];
    readonly history: number | undefined;

    constructor(ent: IITC.EntityPortalDetailed) {
        super(ent as unknown as IITC.EntityPortalOverview);

        const data = ent[2];
        this.mods = data[14];
        this.resonators = data[15];
        this.owner = data[16];
        this.artifactDetail = data[17];
        this.history = data[18];
    }
}