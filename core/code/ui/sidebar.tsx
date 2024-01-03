import { Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { PortalInfoDetailed, RESO_NRG } from "../portal/portal_info_detailed";

import { COLORS_LVL, FACTION, FACTION_COLORS, FACTION_CSS } from "../constants";
import { fixPortalImageUrl } from "../portal/portal_display";
import * as Icons from "./components/icon";
import { PortalMOD, PortalRESO } from "../portal/portal_info";
import { COLORS_MOD } from "../portal/portal_display_helper";

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
                    <PortalResonators resonators={getPortalDetails().resonators} />
                </Show>
            </div>
        </div>);
    //
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
            <div class="info-text"><Agent nickname={p.details.owner} faction={p.details.team}></Agent></div>
        </Show>
    </div>
}


const Agent: Component<{ nickname: string, faction?: FACTION}> = p => {
    return <span 
        class={ p.faction ? FACTION_CSS[p.faction] : "" }>
        {p.nickname}</span>
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
        <For each={order()}>{(slot,index) =>
            <PortalResonator info={p.resonators[slot]} class={ (index()%2===0)? "left-column":"right-column"}/>
        }</For>
    </div>
}


const PortalResonator: Component<{ info: PortalRESO, class?: string }> = p => {
    const energy = createMemo<number>(() => p.info ? (p.info.energy / RESO_NRG[p.info.level] * 100) : 0);

    return <div class={"resonator" + (p.class ? " "+p.class : "")}>
        <Show when={p.info} >
            <HealthMeter level={p.info.level} percent={energy()}/>
            <LevelNumber level={p.info.level} />
            <div class="resostats">
                <span class="resoenergy">{Math.round(energy())}%</span>
                <span class="nickname">{p.info.owner}</span>
            </div>
        </Show>
    </div >
}


const HealthMeter: Component<{ level: number, percent: number, classname?: string }> = (p) => {
    return <div 
        class= {"meter"+ (p.classname ? " "+p.classname : "")}
        style= {{
            background: COLORS_LVL[p.level || 0] + '32'
        }}>
            <div style= {{
                height: p.percent.toString()+"%",
                background: COLORS_LVL[p.level || 0]
             }}
            
            ></div>
        </div>
}

const LevelNumber: Component<{ level: number }> = (p) => {
    return <div  class= "meter-level"
        style={{ color: (p.level < 3 ? "#9900FF" : "#FFFFFF")}}
        >{p.level }</div>

}

const PortalMods: Component<{ mods: PortalMOD[] }> = p => {
    return <div class="mods">
        <For each={p.mods}>{mod =>
            <PortalMod mod={mod}/>
        }</For>
    </div>
}

const PortalMod: Component<{ mod: PortalMOD }> = p => {

    const text = createMemo( ()=> {
        return "";
        // "Rare Turret
        // Installed by: linky36
        // Stats:
        // +20% Hit bonus
        // +1.5x Attack frequency
        // +20% Removal stickiness"
    });

    return <span 
        style={{
            color: p.mod.rarity ? COLORS_MOD[p.mod.rarity] : "#fff"
        }}>
        {p.mod.type || "(unknown mod)"}</span>
}

/*
export const getModDetails = (d: PortalInfoDetailed): string => {
    const mods: string[] = [];
    const modsTitle = [];
    const modsColor = [];
    d.mods.forEach(mod => {
        let modName = "";
        let modTooltip = "";
        let modColor = "#000";

        if (mod !== NoPortalMod) {
            // all mods seem to follow the same pattern for the data structure
            // but let's try and make this robust enough to handle possible future differences

            modName = mod.type || "(unknown mod)";

            if (mod.rarity) {
                modName = mod.rarity.capitalize().replace(/_/g, " ") + " " + modName;
            }

            modTooltip = modName + "\n";
            if (mod.owner) {
                modTooltip += "Installed by: " + mod.owner + "\n";
            }

            if (mod.stats) {
                modTooltip += "Stats:";
                for (const key in mod.stats) {
                    if (!mod.stats.hasOwnProperty(key)) continue;

                    const value = mod.stats[key];
                    let valueStr = value.toString(); // display unmodified. correct for shield mitigation and multihack

                    // if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

                    // special formatting for known mod stats, where the display of the raw value is less useful
                    switch (key) {
                        case "HACK_SPEED": { valueStr = `${value / 10000}%`; break; }
                        case "HIT_BONUS": { valueStr = `${value / 10000}%`; break; }
                        case "ATTACK_FREQUENCY": { valueStr = `${value / 1000}x`; break; }
                        case "FORCE_AMPLIFIER": { valueStr = `${value / 1000}x`; break; }
                        case "LINK_RANGE_MULTIPLIER": { valueStr = `${value / 1000}x`; break; }
                        case "LINK_DEFENSE_BOOST": { valueStr = `${value / 1000}x`; break; }
                        case "REMOVAL_STICKINESS": { if (value > 100) valueStr = `${value / 10000}%`; break; } // an educated guess
                    }

                    modTooltip += "\n+" + valueStr + " " + key.capitalize().replace(/_/g, " ");
                }
            }

            if (mod.rarity) {
                modColor = COLORS_MOD[mod.rarity];
            } else {
                modColor = "#fff";
            }
        }

        mods.push(modName);
        modsTitle.push(modTooltip);
        modsColor.push(modColor);
    });


    let t = "";
    for (let i = 0; i < mods.length; i++) {
        t += "<span" + (modsTitle[i].length ? ' title="' + modsTitle[i] + '"' : "") + ' style="color:' + modsColor[i] + '">' + mods[i] + "</span>"
    }
    // and add blank entries if we have less than 4 mods (as the server no longer returns all mod slots, but just the filled ones)
    for (let i = mods.length; i < 4; i++) {
        t += '<span style="color:#000"></span>'
    }

    return '<div class="mods">' + t + "</div>";
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

