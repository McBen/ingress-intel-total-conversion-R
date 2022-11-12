import { NoPortalMod, PortalInfo, PortalMOD, PortalRESO } from "./portal_info";
import { player } from "../helper/player";
import { FACTION } from "../constants";

const MAX_RESO_PER_PLAYER = [0, 8, 4, 4, 4, 2, 2, 1, 1];
const DESTROY_RESONATOR = 75; // AP for destroying portal
const DESTROY_LINK = 187; // AP for destroying link
const DESTROY_FIELD = 750; // AP for destroying field
const CAPTURE_PORTAL = 500; // AP for capturing a portal
const DEPLOY_RESONATOR = 125; // AP for deploying a resonator
const COMPLETION_BONUS = 250; // AP for deploying all resonators on portal
const UPGRADE_ANOTHERS_RESONATOR = 65; // AP for upgrading another's resonator

const HACK_COOLDOWN_FRIENDLY = 3 * 60; // Temp change 1.10.22
const HACK_COOLDOWN_ENEMY = 5 * 60; // Temp change 1.10.22
const BASE_HACK_COUNT = 4;

export const RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];



export class PortalInfoDetailed extends PortalInfo {
    readonly mods: [PortalMOD, PortalMOD, PortalMOD, PortalMOD];
    readonly resonators: PortalRESO[];
    readonly owner: string;
    readonly artifactDetail: [];
    readonly history: number | undefined;

    constructor(data: IITC.EntityPortalDetailed) {
        super(data as unknown as IITC.EntityPortalOverview);

        this.mods = [NoPortalMod, NoPortalMod, NoPortalMod, NoPortalMod];
        for (let i = 0; i < 4; i++) {
            const inMod = data[14][i];
            if (inMod) this.mods[i] = new PortalMOD(inMod);
        }

        this.resonators = data[15].map(r => r ? new PortalRESO(r) : undefined);
        this.owner = data[16];
        this.artifactDetail = data[17];
        this.history = data[18];

        console.assert(this.mods !== undefined, "mods are undefined");
    }


    getPortalRange(): { base: number, boost: number, range: number, isLinkable: boolean } {
        // formula by the great gals and guys at
        // http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/

        // currently we get a short resonator array when some are missing
        // but in the past we used to always get an array of 8, but will 'null' objects for some entries. maybe that will return?
        const resoMissing = this.resonators.length < 8 || this.resonators.some(r => !r);

        const base = 160 * Math.pow(this.getPortalLevel(), 4);
        const boost = this.getLinkAmpRangeBoost();

        return {
            base,
            boost,
            range: boost * base,
            isLinkable: !resoMissing
        };
    }


    getLinkAmpRangeBoost(): number {
        // additional range boost calculation

        // link amps scale: first is full, second a quarter, the last two an eighth
        const scale = [1.0, 0.25, 0.125, 0.125];

        let boost = 0.0;  // initial boost is 0.0 (i.e. no boost over standard range)

        const linkAmps = this.getPortalModsByType("LINK_AMPLIFIER");

        linkAmps.forEach((mod, i) => {
            // link amp stat LINK_RANGE_MULTIPLIER is 2000 for rare, and gives 2x boost to the range
            // and very-rare is 7000 and gives 7x the range
            const baseMultiplier = mod.stats.LINK_RANGE_MULTIPLIER / 1000;
            boost += baseMultiplier * scale[i];
        });

        return (linkAmps.length > 0) ? boost : 1.0;
    }


    /**
     * returns a float. Displayed portal level is always rounded down from that value.
     */
    getPortalLevel(): number {
        let lvl = 0;
        let hasReso = false;

        this.resonators.forEach(reso => {
            if (!reso) return true;
            lvl += reso.level;
            hasReso = true;
        });

        return hasReso ? Math.max(1, lvl / 8) : 0;
    }


    getPortalModsByType(type): PortalMOD[] {

        const typeToStat = {
            RES_SHIELD: "MITIGATION",
            FORCE_AMP: "FORCE_AMPLIFIER",
            TURRET: "HIT_BONUS",  // and/or ATTACK_FREQUENCY??
            HEATSINK: "HACK_SPEED",
            MULTIHACK: "BURNOUT_INSULATION",
            LINK_AMPLIFIER: "LINK_RANGE_MULTIPLIER",
            ULTRA_LINK_AMP: "OUTGOING_LINKS_BONUS" // and/or LINK_DEFENSE_BOOST??
        };

        const stat = typeToStat[type];

        const mods = this.mods.filter(mod => mod && stat in mod.stats);

        // sorting mods by the stat keeps code simpler, when calculating combined mod effects
        mods.sort((a, b) => b.stats[stat] - a.stats[stat]);

        return mods;
    }

    getMaxOutgoingLinks(): number {
        const linkAmps = this.getPortalModsByType("ULTRA_LINK_AMP");

        let links = 8;

        linkAmps.forEach(mod => {
            links += mod.stats.OUTGOING_LINKS_BONUS;
        });

        return links;
    }


    /**
     * calculate AP gain from destroying portal and then capturing it by deploying resonators
     */
    getAttackApGain(fieldCount: number, linkCount: number): {
        friendlyAp: number, deployCount: number, upgradeCount: number,
        enemyAp: number, destroyAp: number, resoAp: number, captureAp: number
    } {
        let resoCount = 0;
        const maxResonators = MAX_RESO_PER_PLAYER.slice(0);
        const curResonators = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let n = player.level + 1; n < 9; n++) {
            maxResonators[n] = 0;
        }

        this.resonators.forEach(reso => {
            resoCount += 1;
            if (reso.owner === player.name) {
                if (maxResonators[reso.level] > 0) {
                    maxResonators[reso.level] -= 1;
                }
            } else {
                curResonators[reso.level] += 1;
            }
        });


        const resoAp = resoCount * DESTROY_RESONATOR;
        const linkAp = linkCount * DESTROY_LINK;
        const fieldAp = fieldCount * DESTROY_FIELD;
        const destroyAp = resoAp + linkAp + fieldAp;
        const captureAp = CAPTURE_PORTAL + 8 * DEPLOY_RESONATOR + COMPLETION_BONUS;
        const enemyAp = destroyAp + captureAp;
        const deployCount = 8 - resoCount;
        const completionAp = (deployCount > 0) ? COMPLETION_BONUS : 0;
        let upgradeCount = 0;
        let upgradeAvailable = maxResonators[8];
        for (let n = 7; n >= 0; n--) {
            upgradeCount += curResonators[n];
            if (upgradeAvailable < upgradeCount) {
                upgradeCount -= (upgradeCount - upgradeAvailable);
            }
            upgradeAvailable += maxResonators[n];
        }
        const friendlyAp = deployCount * DEPLOY_RESONATOR + upgradeCount * UPGRADE_ANOTHERS_RESONATOR + completionAp;

        return {
            friendlyAp,
            deployCount,
            upgradeCount,
            enemyAp,
            destroyAp,
            resoAp,
            captureAp
        };
    }


    getPortalAttackValues(): { hit_bonus: number, force_amplifier: number, attack_frequency: number } {
        const forceamps = this.getPortalModsByType("FORCE_AMP");
        const turrets = this.getPortalModsByType("TURRET");

        // at the time of writing, only rare force amps and turrets have been seen in the wild, so there's a little guesswork
        // at how the stats work and combine
        // algorithm has been compied from getLinkAmpRangeBoost
        // FIXME: only extract stats and put the calculation in a method to be used for link range, force amplifier and attack
        // frequency
        // note: scanner shows rounded values (adding a second FA shows: 2.5x+0.2x=2.8x, which should be 2.5x+0.25x=2.75x)

        // amplifier scale: first is full, second a quarter, the last two an eighth
        const scale = [1.0, 0.25, 0.125, 0.125];

        const attackValues = {
            hit_bonus: 0,
            force_amplifier: 0,
            attack_frequency: 0
        };

        forceamps.forEach((mod, i) => {
            // force amp stat FORCE_AMPLIFIER is 2000 for rare, and gives 2x boost to the range
            const baseMultiplier = mod.stats.FORCE_AMPLIFIER / 1000;
            attackValues.force_amplifier += baseMultiplier * scale[i];
        });

        turrets.forEach((mod, i) => {
            // turret stat ATTACK_FREQUENCY is 2000 for rare, and gives 2x boost to the range
            const baseMultiplier = mod.stats.ATTACK_FREQUENCY / 1000;
            attackValues.attack_frequency += baseMultiplier * scale[i];

            attackValues.hit_bonus += mod.stats.HIT_BONUS / 10000;
        });

        return attackValues;
    }


    getPortalHackDetails(): { cooldown: number, hacks: number, burnout: number } {

        // first mod of type is fully effective, the others are only 50% effective
        const effectivenessReduction = [1, 0.5, 0.5, 0.5];

        let cooldownTime = player.isTeam(this.team) ? HACK_COOLDOWN_FRIENDLY : HACK_COOLDOWN_ENEMY;

        const heatsinks = this.getPortalModsByType("HEATSINK");
        heatsinks.forEach((mod, index) => {
            const hackSpeed = mod.stats.HACK_SPEED / 1000000;
            cooldownTime = Math.round(cooldownTime * (1 - hackSpeed * effectivenessReduction[index]));
        });

        let hackCount = BASE_HACK_COUNT; // default hacks

        const multihacks = this.getPortalModsByType("MULTIHACK");
        multihacks.forEach((mod, index) => {
            const extraHacks = mod.stats.BURNOUT_INSULATION;
            hackCount = hackCount + (extraHacks * effectivenessReduction[index]);
        });

        return { cooldown: cooldownTime, hacks: hackCount, burnout: cooldownTime * (hackCount - 1) };
    }



    getPortalShieldMitigation(): number {
        const shields = this.getPortalModsByType("RES_SHIELD");

        let mitigation = 0;
        shields.forEach(s => {
            mitigation += s.stats.MITIGATION;
        });

        return mitigation;
    }

    getPortalLinkDefenseBoost() {
        const ultraLinkAmps = this.getPortalModsByType("ULTRA_LINK_AMP");

        let linkDefenseBoost = 1;

        ultraLinkAmps.forEach(ultraLinkAmp => {
            linkDefenseBoost *= ultraLinkAmp.stats.LINK_DEFENSE_BOOST / 1000;
        });

        return Math.round(10 * linkDefenseBoost) / 10;
    }

    getPortalLinksMitigation(linkCount) {
        const mitigation = Math.round(400 / 9 * Math.atan(linkCount / Math.E));
        return mitigation;
    }

    getPortalMitigationDetails(linkCount) {
        const linkDefenseBoost = this.getPortalLinkDefenseBoost();

        const shields = this.getPortalShieldMitigation();
        const links = this.getPortalLinksMitigation(linkCount) * linkDefenseBoost;

        // mitigation is limited to 95% (as confirmed by Brandon Badger on G+)
        const total = Math.min(95, shields + links);

        let excess = (shields + links) - total;
        excess = Math.round(10 * excess) / 10;


        const mitigation = {
            shields,
            links,
            linkDefenseBoost,
            excess,
            total
        };
        return mitigation;
    }

    getTotalPortalEnergy(): number {
        let nrg = 0;
        this.resonators.forEach(reso => {
            nrg += RESO_NRG[reso.level];
        });
        return nrg;
    }


    getCurrentPortalEnergy(): number {
        let nrg = 0;
        this.resonators.forEach(reso => {
            nrg += reso.energy;
        });

        return nrg;
    }


    /**
     * return summary portal data, as seen in the map tile data
     */
    getPortalSummaryData(): {
        level: number, title: string,
        image: string, resCount: number,
        latE6: number, lngE6: number,
        health: number, team: FACTION,
        type: "portal"
    } {

        // NOTE: the summary data reports unclaimed portals as level 1 - not zero as elsewhere in IITC
        let level = this.level;
        if (level === 0) level = 1; // niantic returns neutral portals as level 1, not 0 as used throughout IITC elsewhere

        const resCount = this.resonators.length;
        const maxEnergy = this.getTotalPortalEnergy();
        const curEnergy = this.getCurrentPortalEnergy();
        const health = maxEnergy > 0 ? Math.floor(curEnergy / maxEnergy * 100) : 0;

        return {
            level,
            title: this.title,
            image: this.image,
            resCount,
            latE6: this.latE6,
            health,
            team: this.team,
            lngE6: this.lngE6,
            type: "portal"
        };
    }

}