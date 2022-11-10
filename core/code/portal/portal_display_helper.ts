import { COLORS_LVL } from "../constants";
import { player } from "../helper/player";
import { digits, formatInterval, genFourColumnTable, prettyEnergy } from "../utils_misc";
import { PortalInfoDetailed, PortalRESO, RESO_NRG } from "./portal_info";

declare function getPortalLinks(guid: PortalGUID): { in: LinkGUID[], out: LinkGUID[] };
declare function getPortalFieldsCount(guid: PortalGUID): number;


export const getPortalMiscDetails = (guid: PortalGUID, d: PortalInfoDetailed): string => {

    let randDetails = "";


    // collect some random data that’s not worth to put in an own method
    const linkInfo = getPortalLinks(guid);
    const maxOutgoing = d.getMaxOutgoingLinks();
    const linkCount = linkInfo.in.length + linkInfo.out.length;
    const links = { incoming: linkInfo.in.length, outgoing: linkInfo.out.length };

    const title = `at most ${maxOutgoing} outgoing links\n${links.outgoing} links out\n${links.incoming} links in\n(${links.outgoing + links.incoming} total)`
    const linksText = ["links", `${links.outgoing} out / ${links.incoming} in`, title];

    const playername = d.owner
        ? '<span class="nickname">' + d.owner + "</span>"
        : "-";
    const playerText = ["owner", playername];


    const fieldCount = getPortalFieldsCount(guid);

    const fieldsText = ["fields", fieldCount];

    const apGainText = getAttackApGainText(d, fieldCount, linkCount);

    const attackValues = d.getPortalAttackValues();


    // collect and html-ify random data

    const randDetailsData = [
        // these pieces of data are only relevant when the portal is captured
        // maybe check if portal is captured and remove?
        // But this makes the info panel look rather empty for unclaimed portals
        playerText, getRangeText(d),
        linksText, fieldsText,
        getMitigationText(d, linkCount), getEnergyText(d),
        // and these have some use, even for uncaptured portals
        apGainText, getHackDetailsText(d)
    ];

    if (attackValues.attack_frequency !== 0)
        randDetailsData.push([
            '<span title="attack frequency" class="text-overflow-ellipsis">attack frequency</span>',
            "×" + attackValues.attack_frequency]);
    if (attackValues.hit_bonus !== 0)
        randDetailsData.push(["hit bonus", attackValues.hit_bonus + "%"]);
    if (attackValues.force_amplifier !== 0)
        randDetailsData.push([
            '<span title="force amplifier" class="text-overflow-ellipsis">force amplifier</span>',
            "×" + attackValues.force_amplifier]);

    randDetails = '<table id="randdetails">' + genFourColumnTable(randDetailsData as [string, string, string][]) + "</table>";


    // artifacts - tacked on after (but not as part of) the 'randdetails' table
    // instead of using the existing columns....
    /*
    TODO: artifacts
    if (d.artifactBrief && d.artifactBrief.target && Object.keys(d.artifactBrief.target).length > 0) {
        var targets = Object.keys(d.artifactBrief.target);
        //currently (2015-07-10) we no longer know the team each target portal is for - so we'll just show the artifact type(s) 
        randDetails += '<div id="artifact_target">Target portal: ' + targets.map(function (x) { return x.capitalize(); }).join(", ") + "</div>";
    }

    // shards - taken directly from the portal details
    if (d.artifactDetail) {
        randDetails += '<div id="artifact_fragments">Shards: ' + d.artifactDetail.displayName + " #" + d.artifactDetail.fragments.join(", ") + "</div>";
    }
    */
    return randDetails;
}

type TextResult = [string, string, string];

const getAttackApGainText = (d: PortalInfoDetailed, fieldCount: number, linkCount: number): TextResult => {
    const breakdown = d.getAttackApGain(fieldCount, linkCount);
    let totalGain = breakdown.enemyAp;

    let t = "";

    if (player.isTeam(d.team)) {
        totalGain = breakdown.friendlyAp;
        t += "Friendly AP:\t" + breakdown.friendlyAp + "\n";
        t += "  Deploy " + breakdown.deployCount + ", ";
        t += "Upgrade " + breakdown.upgradeCount + "\n";
        t += "\n";
    }
    t += "Enemy AP:\t" + breakdown.enemyAp + "\n";
    t += "  Destroy AP:\t" + breakdown.destroyAp + "\n";
    t += "  Capture AP:\t" + breakdown.captureAp + "\n";

    return ["AP Gain", digits(totalGain), t];
}



const getEnergyText = (d: PortalInfoDetailed): TextResult => {
    const currentNrg = d.getCurrentPortalEnergy();
    const totalNrg = d.getTotalPortalEnergy();
    const title = `${currentNrg} / ${totalNrg}`;
    const fill = prettyEnergy(currentNrg) + " / " + prettyEnergy(totalNrg)
    return ["energy", fill, title];
}



const getHackDetailsText = (d: PortalInfoDetailed): TextResult => {
    const hackDetails = d.getPortalHackDetails();

    const shortHackInfo = hackDetails.hacks + " @ " + formatInterval(hackDetails.cooldown);

    const title = "Hacks available every 4 hours\n"
        + "Hack count:\t" + hackDetails.hacks + "\n"
        + "Cooldown time:\t" + formatInterval(hackDetails.cooldown) + "\n"
        + "Burnout time:\t" + formatInterval(hackDetails.burnout);

    return ["hacks", shortHackInfo, title];
}


const getMitigationText = (d: PortalInfoDetailed, linkCount: number): TextResult => {
    const mitigationDetails = d.getPortalMitigationDetails(linkCount);

    let mitigationShort = mitigationDetails.total.toString();
    if (mitigationDetails.excess) mitigationShort += ` (+${mitigationDetails.excess})`;

    const title = `Total shielding:\t${mitigationDetails.shields + mitigationDetails.links}\n- active:\t` +
        `${mitigationDetails.total}\n- excess:\t${mitigationDetails.excess}\nFrom\n- shields:\t${mitigationDetails.shields}\n`
        + `- links:\t${mitigationDetails.links} (${mitigationDetails.linkDefenseBoost}x)`;

    return ["shielding", mitigationShort, title];
}


// returns displayable text+link about portal range
const getRangeText = (d: PortalInfoDetailed): TextResult => {
    const range = d.getPortalRange();

    let title = `Base range:\t${digits(Math.floor(range.base))}m\nLink amp boost:\t×${range.boost}\nRange:\t${digits(Math.floor(range.range))}m`;

    if (!range.isLinkable) title += "\nPortal is missing resonators,\nno new links can be made";

    return ["range",
        '<a onclick="window.rangeLinkClick()"'
        + (range.isLinkable ? "" : ' style="text-decoration:line-through;"')
        + ">"
        + (range.range > 1000
            ? Math.floor(range.range / 1000) + " km"
            : Math.floor(range.range) + " m")
        + "</a>",
        title];
}



export const getResonatorDetails = (d: PortalInfoDetailed): string => {
    const resoDetails: [string, string, string?][] = [];
    // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
    // resos in the display should be ordered like this:
    //   N    NE         Since the view is displayed in rows, they
    //  NW    E          need to be ordered like this: N NE NW E W SE SW S
    //   W    SE         i.e. 2 1 3 0 4 7 5 6
    //  SW    S
    // note: as of 2014-05-23 update, this is not true for portals with empty slots!

    const processResonatorSlot = (reso?: PortalRESO, slot?: number) => {
        let lvl = 0;
        let nrg = 0;
        let owner: string | undefined;

        if (reso) {
            lvl = reso.level;
            nrg = reso.energy;
            owner = reso.owner;
        }

        resoDetails.push(renderResonatorDetails(slot, lvl, nrg, owner));
    };


    // if all 8 resonators are deployed, we know which is in which slot

    if (d.resonators.length === 8) {
        // fully deployed - we can make assumptions about deployment slots
        [2, 1, 3, 0, 4, 7, 5, 6].forEach(slot => {
            processResonatorSlot(d.resonators[slot], slot);
        });
    } else {
        // partially deployed portal - we can no longer find out which resonator is in which slot
        for (let ind = 0; ind < 8; ind++) {
            processResonatorSlot(ind < d.resonators.length ? d.resonators[ind] : undefined);
        }

    }

    return '<table id="resodetails">' + genFourColumnTable(resoDetails) + "</table>";

}

// helper function that renders the HTML for a given resonator. Does
// not work with raw details-hash. Needs digested infos instead:
// slot: which slot this resonator occupies. Starts with 0 (east) and
// rotates clockwise. So, last one is 7 (southeast).

const OCTANTS = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"];
const OCTANTS_ARROW = ["→", "↗", "↑", "↖", "←", "↙", "↓", "↘"];

const renderResonatorDetails = (slot: number, level: number, nrg: number, nick?: string): [string, string] => {
    let className = "meter";
    if (OCTANTS[slot] === "N") className = "meter north";

    const max = RESO_NRG[level];
    const fillGrade = level > 0 ? nrg / max * 100 : 0;

    const inf = (level > 0 ? `energy:\t${nrg} / ${max} (${Math.round(fillGrade)}%)\nlevel:\t${level}\nowner:\t${nick}\n`
        : "")
        + (slot !== null ? "octant:\t" + OCTANTS[slot] + " " + OCTANTS_ARROW[slot] : "");

    const style = fillGrade ? `width:${fillGrade}%; background:${COLORS_LVL[level]};` : "";

    const color = (level < 3 ? "#9900FF" : "#FFFFFF");

    const lbar = level > 0 ? `<span class="meter-level" style="color: ${color};"> L ${level} </span>` : "";

    const fill = '<span style="' + style + '"></span>';

    const meter = '<span class="' + className + '" title="' + inf + '">' + fill + lbar + "</span>";

    nick = nick ? `<span class="nickname">${nick}</span>` : "";
    return [meter, nick];
}

