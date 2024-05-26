import { Component, createSignal, For } from "solid-js"
import { LogRequest } from "./logrequest";
import { unixTimeToDateTimeString, unixTimeToHHmm } from "../../helper/times";
import { Dynamic } from "solid-js/web";
import { FACTION, FACTION_CSS, FACTION_NAMES } from "../../constants";
import { selectPortalByLatLng } from "../../map/url_paramater";
import { makePermalink } from "../../helper/utils_misc";
import { player as whoami } from "../../helper/player";



export const [tabs, setTabs] = createSignal<LogRequest[]>([])
export const [lines, setLines] = createSignal<Intel.ChatLine[]>([]);
export const [current, setCurrent] = createSignal(tabs()[0]);

export const LogSetPage = (page: LogRequest) => {
    page.request(false);
    setCurrent(page);
}

export const LogWindow = () => {
    const updateTab = (page: LogRequest) => (page) => LogSetPage(page);

    return (
        <>
            <ul class="logtabs">
                <For each={tabs()}>
                    {item => (
                        <li classList={{ selected: current() === item }} onClick={updateTab(item)}>
                            {item.title}
                        </li>
                    )}
                </For>
            </ul>
            <div class="loglines">
                <div class="contents">
                    <table>
                        <For each={lines()}>
                            {line => <ChatLine line={line} />}
                        </For>
                    </table>
                </div>
                <input class="sendtext" style="text"></input>
            </div>
        </>
    );
};


export const ChatLine: Component<{ line: Intel.ChatLine }> = p => {

    const componets = {
        "TEXT": MarkupTEXT,
        "PLAYER": MarkupPLAYER,
        "PORTAL": MarkupPORTAL,
        "FACTION": MarkupFACTION,
    }

    const markup = simplifyChatLine(p.line[2].plext.markup);

    return (
        <tr>
            <td><ChatTime time={p.line[1]} /></td>
            <td><ChatSender plext={p.line[2]} /></td>
            <For each={markup}>
                {markup => (
                    <Dynamic component={componets[markup[0]] || MarkupTEXT} markup={markup[1]} />
                )}
            </For>
        </tr>
    )
}

const simplifyChatLine = (markup: Intel.MarkUp): Intel.MarkUp => {

    // Collapse <faction> + "Link"/"Field".
    if (
        markup.length > 4 &&
        markup[3][0] === 'FACTION' &&
        markup[4][0] === 'TEXT' &&
        (markup[4][1].plain === ' Link ' || markup[4][1].plain === ' Control Field @')
    ) {
        (markup[4][1] as any).team = markup[3][1].team;
        markup = markup.slice() as Intel.MarkUp;
        markup.splice(3, 1);
    }

    // Skip "Agent <player>" at the beginning
    if (markup.length > 1 && markup[0][0] === 'TEXT' && markup[0][1].plain === 'Agent ' && markup[1][0] === 'PLAYER') {
        markup = markup.slice(2) as Intel.MarkUp;
    }

    // Skip "<faction> agent <player>" at the beginning
    if (markup.length > 2 && markup[0][0] === 'FACTION' && markup[1][0] === 'TEXT' && markup[1][1].plain === ' agent ' && markup[2][0] === 'PLAYER') {
        markup = markup.slice(2) as Intel.MarkUp;
    }

    return markup;

}

const ChatTime: Component<{ time: number }> = p => {
    const time_str = unixTimeToHHmm(p.time);
    const datetime = unixTimeToDateTimeString(p.time, true);
    const datetime_title = (datetime.slice(0, 19) + '<small class="milliseconds">' + datetime.slice(19) + '</small>')

    return (
        <time title={datetime_title} data-timestamp={p.time}>{time_str}</time>
    )
}


const ChatSender: Component<{ plext: Intel.PlextContainer }> = p => {

    const agent = getPlayer(p.plext);

    const classes = ["nickname"];
    const fclass = FACTION_CSS[agent.team];
    if (fclass) classes.push(fclass);
    if (whoami.itsMe(agent.name)) classes.push("pl_nudge_me");

    return (
        <>
            <span class="invisep">&lt;</span>
            <mark class={classes.join(" ")}>{agent.name}</mark>
            <span class="invisep">&gt;</span>
        </>
    );
}

const getPlayer = (plext: Intel.PlextContainer): { name: string, team: FACTION } => {

    var player = {
        name: '',
        team: teamStringToId(plext.plext.team)
    };

    plext.plext.markup.forEach(function (ent) {
        switch (ent[0]) {
            case 'SENDER': // user generated messages
                player.name = ent[1].plain.replace(/: $/, ''); // cut “: ” at end
                break;

            case 'PLAYER': // automatically generated messages
                player.name = ent[1].plain;
                player.team = teamStringToId(ent[1].team);
                break;

            default:
                break;
        }
    });

    return player;
}


const MarkupTEXT: Component<{ markup: Intel.MarkUpTextType }> = p => {
    const team = (p.markup as any).team;
    if (team && FACTION_CSS[team]) {
        return <span class={FACTION_CSS[team]}>{p.markup.plain}</span>
    } else {
        return <>{p.markup.plain}</>
    }
}

const MarkupPLAYER: Component<{ markup: Intel.MarkUpPlayerType }> = p => {
    return <span class="nickname">{p.markup.plain}</span>
}

const MarkupPORTAL: Component<{ markup: Intel.MarkUpPortalType }> = p => {

    const latlng = L.latLng(p.markup.latE6 / 1e6, p.markup.lngE6 / 1e6)
    const permalink = makePermalink(latlng);

    return <a
        onClick={() => selectPortalByLatLng(latlng)}
        title={p.markup.address}
        class="help"
        href={permalink}
    >{p.markup.name}</a>
}

const MarkupFACTION: Component<{ markup: Intel.MarkUpFactionType }> = p => {
    const teamId = teamStringToId(p.markup.team);
    return <span class={FACTION_CSS[teamId]}>{FACTION_NAMES[teamId]}</span>
}

