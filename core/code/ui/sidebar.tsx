/* eslint-disable unicorn/prefer-string-replace-all */
import { Component, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { PortalInfoDetailed } from "../portal/portal_info_detailed";

import { FACTION, FACTION_CSS } from "../constants";
import { fixPortalImageUrl } from "../portal/portal_display";
import * as Icons from "./components/icon";
import { dialog } from "./dialog";
import { PortalMods } from "./portal/PortalMods";
import { PortalResonators } from "./portal/PortalResonators";
import { getPortalFieldsCount, getPortalLinks } from "../helper/portal_data";
import { digits, zoomToAndShowPortal } from "../helper/utils_misc";
import { formatInterval } from "../helper/times";
import { player } from "../helper/player";
import { portalDetail } from "../portal/portal_details_get";
import { sharePortalDialog } from "./dialogs/share";


export const setupSidebar = () => {
    const wrapper = document.querySelector("#scrollwrapper");
    render(() => <Sidebar />, wrapper);
}


export const [getPortalDetails, setPortalDetails] = createSignal<PortalInfoDetailed | undefined>();

const Sidebar = () => {
    return (
        <div id="sidebar2">
            <div id="portaldetails2">
                <Show when={getPortalDetails()} fallback={<div id="portalStatus">...</div>}>
                    <PortalTitle details={getPortalDetails()} /><PortalCloseButton />
                    <PortalImage details={getPortalDetails()} />
                    <PortalMods mods={getPortalDetails().mods} />
                    <PortalOwner details={getPortalDetails()} />
                    <PortalResonators resonators={getPortalDetails().resonators} team={getPortalDetails().team} />
                    <PortalMiscData details={getPortalDetails()} />
                </Show>
            </div>
        </div>);
    //
    // < historyDetails prop="window.getPortalHistoryDetails(data)" />
}


const PortalTitle: Component<{ details: PortalInfoDetailed }> = p => {

    const levelInt = () => (p.details && p.details.team !== FACTION.none) ? p.details.level : 0;

    return (<div class="title-block">
        <div class="info-icon" id="level2" title={getLevelDetails(p.details)}>{levelInt()}</div>
        <h3 class="info-text title"
            title="Click to move to portal"
            onClick={() => zoomTo(p.details.guid, p.details.latE6, p.details.lngE6)}
        >{p.details.title}
        </h3>
        <span class="portal_link" onClick={() => sharePortal(getPortalDetails().guid)}><Icons.IconShare /></span>
    </div >
    );
}


const PortalOwner: Component<{ details: PortalInfoDetailed }> = p => {
    return <div class="info-item">
        <div class="info-icon"><Icons.FiUser /></div>
        <Show when={p.details.owner}>
            <div class="info-text"><Agent nickname={p.details.owner} faction={p.details.team}></Agent></div>
        </Show>
    </div>
}


export const Agent: Component<{ nickname: string, faction?: FACTION }> = p => {
    return <span
        class={p.faction ? FACTION_CSS[p.faction] : ""}>
        {p.nickname}</span>
}


const PortalImage: Component<{ details: PortalInfoDetailed }> = p => {

    const source = createMemo(() => fixPortalImageUrl(p.details.image));

    return <div
        class="imgpreview"
        title={`${p.details.title}\n\nClick to show full image.`}
        style={{
            "background-image": `url(${source()})`
        }}
        onClick={() => {
            dialog({
                html: $("<img>", { src: source() }),
                title: p.details.title,
                id: "iitc-portal-image",
                width: "auto",
                resizable: false
            });

        }} />;
}


const PortalCloseButton = () => {
    // TODO: click: () => this.clearDetails()
    return <span class="close" title="Close [w]" accessKey="w">X</span>;
}


const PortalHealth: Component<{ details: PortalInfoDetailed }> = p => {

    const fillGrade = createMemo<number>(() => {
        const total = p.details.getTotalPortalEnergy()
        return total > 0 ? p.details.getCurrentPortalEnergy() / total * 100 : 0;
    });

    /*
      const infoText = createMemo(() => {
            return `${fillGrade}% `
            + (getTotalPortalEnergy(details) > 0 ? `(${getCurrentPortalEnergy(details)} / ${getTotalPortalEnergy(details)})` : "");
        });
    */

    return (
        <div class="info-item">
            <IconEnergy value={fillGrade()} />
            <div class="info-text">{Math.ceil(fillGrade())}%</div>
        </div>
    );
}


const IconEnergy: Component<{ value: number }> = props => {
    const icon = createMemo<number>(() => Math.floor(props.value / 11));

    return (
        <Switch>
            <Match when={icon() < 1}><Icons.IconEnergy0 /></Match>
            <Match when={icon() < 2}><Icons.IconEnergy10 /></Match>
            <Match when={icon() < 3}><Icons.IconEnergy20 /></Match>
            <Match when={icon() < 4}><Icons.IconEnergy30 /></Match>
            <Match when={icon() < 5}><Icons.IconEnergy40 /></Match>
            <Match when={icon() < 6}><Icons.IconEnergy50 /></Match>
            <Match when={icon() < 7}><Icons.IconEnergy60 /></Match>
            <Match when={icon() < 8}><Icons.IconEnergy70 /></Match>
            <Match when={icon() < 9}><Icons.IconEnergy80 /></Match>
            <Match when={icon() < 10}><Icons.IconEnergy90 /></Match>
            <Match when={icon() < 11}><Icons.IconEnergy100 /></Match>
        </Switch>
    )
}


const getLevelDetails = (portal: PortalInfoDetailed): string => {
    const levelInt = portal.team === FACTION.none ? 0 : portal.level;
    let levelDetails = `Level ${levelInt}`;
    const levelFloat = portal.getPortalLevel();
    if (levelFloat === 8) {
        levelDetails = "Level 8\nfully upgraded";
    } else {
        let requiredLevels = (Math.ceil(levelFloat) - levelFloat) * 8;
        if (requiredLevels === 0) requiredLevels = 8;
        levelDetails += `Level ${levelFloat}\n${requiredLevels} resonator level(s) needed for next portal level`;
    }

    return levelDetails;
}


const zoomTo = (guid: PortalGUID, latE6: number, lngE6: number) => {
    zoomToAndShowPortal(guid, L.latLng(latE6 * 1e-6, lngE6 * 1e-6));
    if (isSmartphone()) { show("map") }
}

const sharePortal = (guid: PortalGUID) => {
    const details = portalDetail.get(guid);
    if (details) {
        sharePortalDialog(details);
    }
}


// TODO: split function
const PortalMiscData: Component<{ details: PortalInfoDetailed }> = p => {

    // Links
    const links = createMemo(() => {
        const linkInfo = getPortalLinks(p.details.guid);
        return { incoming: linkInfo.in.length, outgoing: linkInfo.out.length };
    });
    const fieldCount = createMemo(() => getPortalFieldsCount(p.details.guid));

    const linkText = () => `${links().outgoing} out / ${links().incoming} in`;
    const linkTitle = () => {
        const maxOutgoing = p.details.getMaxOutgoingLinks();
        return "Links\n" +
            `at most ${maxOutgoing} outgoing links\n` +
            `${links().outgoing} links out\n` +
            `${links().incoming} links in\n` +
            `(${links().outgoing + links().incoming} total)`
    };

    const range = createMemo(() => getRangeText(p.details));
    const hack = createMemo(() => getHackDetailsText(p.details));
    const migrate = createMemo(() => getMitigationText(p.details, links().incoming + links().outgoing));
    const apGain = createMemo(() => getAttackApGainText(p.details, fieldCount(), links().incoming + links().outgoing));

    return <div class="stats">
        <div class="stat"><PortalHealth details={getPortalDetails()} /></div>
        <div class="stat" title={migrate().title}><Icons.FiShield />{migrate().text}</div>
        <div class="stat" title={apGain().title}><Icons.TbMoneybag />{apGain().text}</div>
        <div class="stat" title="Fields"><Icons.TbVectorTriangle />{fieldCount()}</div>
        <div class="stat" title={range().title}><Icons.BiRegularRuler />{range().text}</div>
        <div class="stat" title={hack().title}><Icons.BiRegularTachometer />{hack().text}</div>
        <div class="stat" title={linkTitle()}><Icons.SiLinktree />{linkText()}</div>
    </div>;
}


const getRangeText = (d: PortalInfoDetailed): { title: string, text: string } => {
    const range = d.getPortalRange();
    let title = `Range:\nBase:\t${digits(Math.floor(range.base))}m\nLink amp boost:\t×${range.boost}\nRange:\t${digits(Math.floor(range.range))}m`;

    if (!range.isLinkable) title += "\nPortal is missing resonators,\nno new links can be made";

    // TODO: add click handler
    const text =
        // '<a onclick="window.rangeLinkClick()"'+ (range.isLinkable ? "" : ' style="text-decoration:line-through;"')+ ">" +
        (range.range > 1000
            ? digits(Math.floor(range.range / 1000)) + " km"
            : digits(Math.floor(range.range)) + " m")
        ; // + "</a>",


    return { title, text };
}

const getHackDetailsText = (d: PortalInfoDetailed): { title: string, text: string } => {
    const hackDetails = d.getPortalHackDetails();

    const text = `${hackDetails.hacks} @ ${formatInterval(hackDetails.cooldown)}`;

    const title = "Hacks available every 4 hours\n"
        + "Hack count:\t" + hackDetails.hacks + "\n"
        + "Cooldown time:\t" + formatInterval(hackDetails.cooldown) + "\n"
        + "Burnout time:\t" + formatInterval(hackDetails.burnout);

    return { title, text };
}


const getMitigationText = (d: PortalInfoDetailed, linkCount: number): { title: string, text: string } => {
    const mitigationDetails = d.getPortalMitigationDetails(linkCount);

    let text = mitigationDetails.total.toString();
    if (mitigationDetails.excess) text += ` (+${mitigationDetails.excess})`;

    const title = `Total shielding:\t${mitigationDetails.shields + mitigationDetails.links}\n- active:\t` +
        `${mitigationDetails.total}\n- excess:\t${mitigationDetails.excess}\nFrom\n- shields:\t${mitigationDetails.shields}\n`
        + `- links:\t${mitigationDetails.links} (${mitigationDetails.linkDefenseBoost}x)`;

    return { title, text };
}


const getAttackApGainText = (d: PortalInfoDetailed, fieldCount: number, linkCount: number): { title: string, text: string } => {
    const breakdown = d.getAttackApGain(fieldCount, linkCount);
    let totalGain = breakdown.enemyAp;


    let title = "AP\n";

    if (player.isTeam(d.team)) {
        totalGain = breakdown.friendlyAp;
        title += "Friendly AP:\t" + breakdown.friendlyAp + "\n";
        title += "  Deploy " + breakdown.deployCount + ", ";
        title += "Upgrade " + breakdown.upgradeCount + "\n";
        title += "\n";
    }
    title += "Enemy AP:\t" + breakdown.enemyAp + "\n";
    title += "  Destroy AP:\t" + breakdown.destroyAp + "\n";
    title += "  Capture AP:\t" + breakdown.captureAp + "\n";

    const text = digits(totalGain);

    return { title, text };
}
