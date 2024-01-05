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


export const setupSidebar = () => {
    const wrapper = document.querySelector("#scrollwrapper2")!;
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
                    <PortalHealth details={getPortalDetails()} />
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
        <span class="portal_link" onClick={[sharePortal, p.details.guid]}><Icons.IconShare /></span>
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

    const src = createMemo( () => fixPortalImageUrl(p.details.image));
    
    return <div
        class="imgpreview"
        title={`${p.details.title}\n\nClick to show full image.`}
        style={{
            "background-image": `url(${src()})`
        }}
        onClick={(e) => {
            dialog({
                html: $("<img>", { src: src() }),
                title: p.details.title,
                id: "iitc-portal-image",
                width: "auto",
                resizable: false
            });
    
        }}/>;
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

const sharePortal = (guid: PortalGUID, e: Event) => {
    // TODO: showWebLinks(guid);
    // import { showWebLinks } from "./plugins/PLink/Main";
}


const PortalMiscData: Component<{ details: PortalInfoDetailed }> = p => {   
    return <div>
        <Icons.FiShield /> 
        <Icons.TbMoneybag />
        <Icons.TbVectorTriangle />
        <Icons.BiRegularTachometer />
        <Icons.BiRegularRuler />
    </div>;
}
