/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable unicorn/switch-case-braces */
/* eslint-disable max-classes-per-file */
import { FACTION } from "../constants";

export const enum HISTORY {
    visited = 1,
    captured = 2,
    scoutControlled = 4,
}

export class PortalInfoBase {

    // readonly guid: PortalGUID;
    // readonly timestamp: number;
    public team: FACTION;
    readonly latE6: number;
    readonly lngE6: number;

    constructor(data: IITC.EntityPortalBasic) {
        this.team = this.teamStr2Faction(data[1]);
        this.latE6 = data[2];
        this.lngE6 = data[3];
    }

    getLocation(): L.LatLng {
        return L.latLng(this.latE6 / 1e6, this.lngE6 / 1e6)
    }


    private teamStr2Faction(team: IITC.EntityTeam): FACTION {
        switch (team) {
            case "R": return FACTION.RES;
            case "E": return FACTION.ENL;
            case "M": return FACTION.MAC;
            default:
            case "N": return FACTION.none;
        }
    }
}

// TODO: temporary, remove
export const teamStr2Faction = (team: IITC.EntityTeam): FACTION => {
    switch (team) {
        case "R": return FACTION.RES;
        case "E": return FACTION.ENL;
        case "M": return FACTION.MAC;
        default:
        case "N": return FACTION.none;
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

    constructor(data: IITC.EntityPortalOverview) {
        super(data as unknown as IITC.EntityPortalBasic);

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

        // fix team
        if (this.team === FACTION.none && this.resCount > 0) {
            this.team = FACTION.MAC;
        }
    }
}


export const enum PortalModStat {
    "HACK_SPEED",
    "HIT_BONUS",
    "ATTACK_FREQUENCY",
    "FORCE_AMPLIFIER",
    "LINK_RANGE_MULTIPLIER",
    "LINK_DEFENSE_BOOST",
    "REMOVAL_STICKINESS"
}

export class PortalMOD {

    public owner: string;
    public type: string;
    public rarity: string;
    public stats: Record<PortalModStat | string, number>;

    constructor(data: IITC.EntityPortalMod) {
        this.owner = data[0];
        this.type = data[1];
        this.rarity = data[2];
        this.stats = data[3] as Record<PortalModStat, number>;
    }
}


export class PortalMODNone extends PortalMOD {
    constructor() {
        super(["", "", "", {}])
    }
}
export const NoPortalMod = new PortalMODNone();


export class PortalRESO {
    public owner: string;
    public level: number;
    public energy: number;

    constructor(data: IITC.EntityPortalReso) {
        this.owner = data[0];
        this.level = data[1];
        this.energy = data[2];

        console.assert(typeof (this.level) === "number", "reso level is not number");
    }
}
