import { Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { PortalInfoDetailed, RESO_NRG } from "../portal/portal_info_detailed";

import { FACTION } from "../constants";
import { fixPortalImageUrl } from "../portal/portal_display";
import * as Icons from "./components/icon";
import { PortalRESO } from "../portal/portal_info";

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
                    <PortalOwner details={getPortalDetails()} />
                    <PortalHealth details={getPortalDetails()} />
                    <PortalResonators resonators={getPortalDetails().resonators} />
                </Show>
            </div>
        </div>);
    //
    // <PortalMods prop="(portalDetails)" />
    // <PortalMiscData prop="(guid, portalDetails)" />
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
            <div class="info-text">{p.details.owner}</div>
        </Show>
    </div>
}


const PortalImage: Component<{ details: PortalInfoDetailed }> = p => {

    return <div
        class="imgpreview"
        title={`${p.details.title}\n\nClick to show full image.`}
        style={{
            "background-image": `url(${fixPortalImageUrl(p.details.image)})`
        }}>
    </div>;

    //     preview.on("click", () => {
    //         dialog({
    //             html: $("<img>", { src: img }),
    //             title,
    //             id: "iitc-portal-image",
    //             width: "auto",
    //             resizable: false
    //         });
    //     })
    // 
}


const PortalCloseButton = () => {
    // click: () => this.clearDetails()
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


const PortalResonators: Component<{ resonators: PortalRESO[] }> = p => {

    // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
    // resos in the display should be ordered like this:
    //   N    NE         Since the view is displayed in rows, they
    //  NW    E          need to be ordered like this: N NE NW E W SE SW S
    //   W    SE         i.e. 2 1 3 0 4 7 5 6
    //  SW    S

    // if all 8 resonators are deployed, we know which is in which slot
    // as of 2014-05-23 update, this is not true for portals with empty slots!

    const order = createMemo(() =>
        p.resonators.length === 8 ? [2, 1, 3, 0, 4, 7, 5, 6] : [0, 1, 2, 3, 4, 5, 6, 7]
    );

    return <div class="resodetails">
        <For each={order()}>{index =>
            <PortalResonator info={p.resonators[index]} />
        }</For>
    </div>
}

const PortalResonator: Component<{ info: PortalRESO }> = p => {
    const energy = createMemo<number>(() => p.info.energy / RESO_NRG[p.info.level] * 100);

    return <div class="resonator">
        <Show when={p.info} >
            <div class="meter-level">{p.info.level}</div>
            <div class="meter">{p.info.level}</div>
            <div>
                <span class="resoenergy">{Math.round(energy())}%</span>
                <span class="nickname">{p.info.owner}%</span>
            </div>
        </Show>
    </div >
}

/*
renderResonatorSlot(slot: number | undefined, level: number, energy: number, owner: string): JQuery {

    const className = (slot && OCTANTS[slot] === "N") ? "meter north" : "meter";

    const max = RESO_NRG[level];
    const fillGrade = level > 0 ? energy / max * 100 : 0;


    let infoText = "";
    if (level > 0) {
        infoText = `energy:\t${energy} / ${max} (${Math.round(fillGrade)}%)\nlevel:\t${level}\nowner:\t${owner}`;
    }
    if (slot !== undefined) {
        infoText += `\noctant:\t${OCTANTS[slot]} ${OCTANTS_ARROW[slot]}`;
    }

    const levelNumber = $("<div>", { class: "meter-level", text: level })
        .css({ color: (level < 3 ? "#9900FF" : "#FFFFFF") });

    const healthMeter = $("<div>", { class: className }).css({ background: COLORS_LVL[level] + "32" }).append(
        $("<div>").css({ height: fillGrade.toString() + "%", background: COLORS_LVL[level] })
    );


    const stats = $("<div>", { class: "resostats" }).append(
        $("<span>", { class: "resoenergy", text: `${Math.round(fillGrade)}%` }),
        owner ? $("<span>", { class: "nickname", text: owner }) : "");

    return $("<div>", { class: "resonator", title: infoText }).append(
        healthMeter,
        levelNumber,
        level > 0 ? stats : "");
}
*/


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

