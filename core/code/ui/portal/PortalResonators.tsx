import { Component, For, Match, Show, Switch, createMemo } from "solid-js";
import { RESO_NRG } from "../../portal/portal_info_detailed";
import { PortalRESO } from "../../portal/portal_info";
import { COLORS_LVL, FACTION } from "../../constants";
import { Agent } from "../sidebar";


export const PortalResonators: Component<{ resonators: PortalRESO[], team: FACTION }> = p => {
    // octant=slot: 0=E, 1=NE, 2=N, 3=NW, 4=W, 5=SW, 6=S, SE=7
    // resos in the display should be ordered like this:
    //   N    NE         Since the view is displayed in rows, they
    //  NW    E          need to be ordered like this: N NE NW E W SE SW S
    //   W    SE         i.e. 2 1 3 0 4 7 5 6
    //  SW    S

    // if all 8 resonators are deployed, we know which is in which slot
    // as of 2014-05-23 update, this is not true for portals with empty slots!
    const order = createMemo(() => p.resonators.length === 8 ? [2, 1, 3, 0, 4, 7, 5, 6] : [0, 1, 2, 3, 4, 5, 6, 7]
    );

    return <div class="resodetails">
        <For each={order()}>{(slot, index) =>
            <PortalResonator
                left={(index() % 2 === 0)}
                info={p.resonators[slot]}
                team={p.team}
            />}
        </For>
    </div>;
};


const PortalResonator: Component<{ info: PortalRESO, team: FACTION, left: boolean }> = p => {
    const energy = createMemo<number>(() => p.info ? (p.info.energy / RESO_NRG[p.info.level] * 100) : 0);

    return <div class={"resonator " + (p.left ? "left-column" : "right-column")}>
        <Show when={p.info} fallback={<HealthMeter level={0} percent={0} />} >
            <Switch >
                <Match when={p.left} >
                    <div class="agent"><Agent nickname={p.info.owner} faction={p.team} /></div>
                    <HealthMeter level={p.info.level} percent={energy()} />
                </Match>
                <Match when={!p.left} >
                    <HealthMeter level={p.info.level} percent={energy()} />
                    <div class="agent"><Agent nickname={p.info.owner} faction={p.team} /></div>
                </Match>
            </Switch>
        </Show>
    </div>;
};


const HealthMeter: Component<{ level: number, percent: number, classname?: string }> = p => {
    return (
        <div
            class={"meter" + (p.classname ? " " + p.classname : "")}
            style={{
                background: COLORS_LVL[p.level || 0] + "32"
            }}>
            <div class="bar"
                style={{
                    width: p.percent.toString() + "%",
                    background: COLORS_LVL[p.level || 0]
                }
                } />
            <Show when={p.level > 0}>
                <div class="number">{p.level}</div>
            </Show>
        </div>
    );
}

const LevelNumber: Component<{ level: number }> = (p) => {
    return (
        <div
            class="meter-level"
            style={{ color: (p.level < 3 ? "#9900FF" : "#FFFFFF") }}
        >{p.level}</div>
    );
}
