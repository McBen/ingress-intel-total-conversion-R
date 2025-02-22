import { Component, createSignal, For } from "solid-js"
import { LogRequest } from "./logrequest";
import { unixTimeToDateTimeString, unixTimeToHHmm } from "../../helper/times";
import { Dynamic } from "solid-js/web";
import { FACTION, FACTION_CSS, FACTION_NAMES } from "../../constants";
import { selectPortalByLatLng } from "../../map/url_paramater";
import { makePermalink } from "../../helper/utils_misc";
import { player as whoami } from "../../helper/player";


export const [tabs, setTabs] = createSignal<LogRequest[]>([])
const [lines, _setLines] = createSignal<Intel.ChatLine[]>([]);
export const [current, setCurrent] = createSignal(tabs()[0]);

export const LogSetPage = (page: LogRequest) => {
    page.request(false);
    setCurrent(page);
}

export const setLines = (lines: Intel.ChatLine[]) => {
    const content = $(".loglines .contents");
    const table = $("table", content);
    const scrollPosition = table.height()! - content.scrollTop()!;

    _setLines(lines);

    // keep scroll position from bottom
    content.scrollTop(table.height()! - scrollPosition);
}



export const LogWindow = () => {
    const updateTab = (page: LogRequest) => () => LogSetPage(page);

    return (
        <>
            <div class="scalebutton ui-resizable-handle ui-resizable-ne" ></div>
            <div>
                <ul class="logtabs">
                    <For each={tabs()}>
                        {item => (
                            <li classList={{ selected: current() === item }} onClick={updateTab(item)}>
                                {item.title}
                            </li>
                        )}
                    </For>
                </ul>
            </div>
            <div class="loglines">
                <div class="contents" onScroll={event => checkForHistoryMessages(event.currentTarget)}>
                    <table>
                        <colgroup>
                            <col style="width:44px" />
                            <col style="width:91px" />
                        </colgroup>
                        <For each={lines()}>
                            {line => <ChatLine line={line} />}
                        </For>
                    </table>
                </div>
                <input class="sendtext" type="text"></input>
            </div>
        </>
    );
}


const CHAT_REQUEST_SCROLL_TOP = 0;

const checkForHistoryMessages = (element: HTMLElement) => {
    //  if (t.data('ignoreNextScroll')) return t.data('ignoreNextScroll', false);
    if (element.scrollTop <= CHAT_REQUEST_SCROLL_TOP) {
        current().request(true);
    }
    // if (window.scrollBottom(t) === 0) channelDesc.request(channelDesc.id, false);
}

export const ChatLine: Component<{ line: Intel.ChatLine }> = p => {

    const componets: Record<string, any> = {
        "TEXT": MarkupTEXT,
        "PLAYER": MarkupPLAYER,
        "PORTAL": MarkupPORTAL,
        "FACTION": MarkupFACTION,
    }

    const markup = simplifyChatLine(p.line[2].plext.markup);

    const categories = p.line[2].plext.categories;
    const isPublic = (categories & 1) === 1;
    const isSecure = (categories & 2) === 2;
    const msgAlert = (categories & 4) === 4;
    const msgToPlayer = msgAlert && (isPublic || isSecure);

    const narrowcast = p.line[2].plext.plextType === 'SYSTEM_NARROWCAST';

    return (
        <tr>
            <td classList={{ pl_nudge_date: msgToPlayer }}><ChatTime time={p.line[1]} /></td>
            <td ><ChatSender plext={p.line[2]} /></td>
            <td classList={{ system_narrowcast: narrowcast }}>
                <For each={markup}>
                    {markup => (
                        <Dynamic component={componets[markup[0]] || MarkupTEXT} markup={markup[1]} />
                    )}
                </For>
            </td>
        </tr >
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
        (markup[4][1] as any).team = teamStringToId(markup[3][1].team);
        markup = [...markup];
        markup.splice(3, 1);
    }

    // remove SENDER + SECURE
    markup = markup.filter(m => m[0] !== "SENDER" && m[0] !== "SECURE");

    // Skip "<faction> agent <player>" at the beginning
    if (markup.length > 2 && markup[0][0] === 'FACTION' && markup[1][0] === 'TEXT' && markup[1][1].plain === ' agent ' && markup[2][0] === 'PLAYER') {
        markup = markup.slice(3) as Intel.MarkUp;
    }

    // Skip "Agent <player>" at the beginning
    if (markup.length > 1 && markup[0][0] === 'TEXT' && markup[0][1].plain === 'Agent ' && markup[1][0] === 'PLAYER') {
        markup = markup.slice(2) as Intel.MarkUp;
    }

    // Skip "<player>" at the beginning
    if (markup.length > 0 && markup[0][0] === 'PLAYER') {
        markup = markup.slice(1) as Intel.MarkUp;
    }

    return markup;
}

const ChatTime: Component<{ time: number }> = p => {
    const time_str = unixTimeToHHmm(p.time);
    const datetime = unixTimeToDateTimeString(p.time, true)!;
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

    const player = {
        name: '',
        team: teamStringToId(plext.plext.team)
    };

    plext.plext.markup.forEach(ent => {
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
    let team = (p.markup as any).team;
    if (team === FACTION.none) team = FACTION.MAC;
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
        onClick={(event: Event) => { selectPortalByLatLng(latlng); event.preventDefault(); }}
        title={p.markup.address}
        class="help"
        style="unicode-bidi: isolate;"
        href={permalink}
    >{p.markup.name}</a>
}

const MarkupFACTION: Component<{ markup: Intel.MarkUpFactionType }> = p => {
    const teamId = teamStringToId(p.markup.team);
    return <span class={FACTION_CSS[teamId]}>{FACTION_NAMES[teamId]}</span>
}

