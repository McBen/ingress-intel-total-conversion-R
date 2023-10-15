/* eslint-disable no-bitwise */
import { IITC } from "../IITC";
import { postAjax } from "../helper/send_request";
import { clampLatLngBounds, escapeHtmlSpecialChars } from "../helper/utils_misc";
import { makePermalink, scrollBottom } from "../helper/utils_misc";
import { idle } from "../map/idle";
import { FACTION, FACTION_COLORS, FACTION_CSS, FACTION_NAMES, teamStr2Faction } from "../constants";
import { player as PLAYER } from "../helper/player";
import { unixTimeToDateTimeString, unixTimeToHHmm } from "../helper/times";
import { Log, LogApp } from "../helper/log_apps";
export const log = Log(LogApp.Chat);

// eslint-disable-next-line unicorn/prefer-module
require("autolink-js");
declare global {
    // eslint-disable-next-line id-blacklist
    interface String {
        autoLink(): string;
    }
}

type ChatGUID = string;

interface MessageInfo {
    guid: string;
    time: number;
    public: boolean;
    secure: boolean;
    alert: boolean;
    messageToPlayer: boolean;
    type: string;
    narrowcast: boolean;
    auto: boolean;
    team: FACTION;
    player: {
        name: string;
        team: FACTION
    },
    markup: Intel.MarkUp;
}

interface CacheData {
    html: string;
    info: MessageInfo;
}


export abstract class ChatChannel {
    abstract name: string;
    abstract hookMessage: string;

    private requestRunning;
    private oldBoundingBox: L.LatLngBounds;

    private needsClearing: boolean;
    private needsScrollTop: boolean;
    public ignoreNextScroll: boolean;

    private data: Map<ChatGUID, CacheData>;
    private guids: string[];
    private oldestTimestamp: number;
    private newestTimestamp: number;
    private oldestGUID?: ChatGUID;
    private newestGUID?: ChatGUID;

    constructor() {
        this.requestRunning = false;
        this.needsClearing = false;

        this.clearData();
    }

    abstract initInput(mark: JQuery, input: JQuery);

    private clearData(): void {
        this.data = new Map();
        this.guids = [];
        this.oldestTimestamp = -1;
        this.newestTimestamp = -1;
        this.oldestGUID = undefined;
        this.newestGUID = undefined;
    }


    monitorData(_id) {
        // window.chat.backgroundChannelData('plugin.machinaTracker', 'all', false); // disable this plugin's interest in 'all' COMM
    }


    request(getOlderMsgs: boolean, isRetry = false) {
        if (this.requestRunning && !isRetry) return;
        if (idle.isIdle()) return renderUpdateStatus();

        this.requestRunning = true;
        $("#chatcontrols a:contains('" + this.name + "')").addClass("loading");

        const d = this.genPostData(getOlderMsgs);
        postAjax("getPlexts", d,
            data => { this.handleData(data as Intel.ChatCallback, getOlderMsgs, d.ascendingTimestampOrder); },
            isRetry
                ? () => { this.requestRunning = false; }
                : () => { this.request(getOlderMsgs, true); }
        );
    }

    handleData(data: Intel.ChatCallback, olderMsgs, ascendingTimestampOrder) {
        this.requestRunning = false;
        $("#chatcontrols a:contains('" + this.name + "')").removeClass("loading");

        if (!data || !data.result) {
            // TODO: mapStatus.showError("faction chat error");
            log.warn(+this.name + " chat error. Waiting for next auto-refresh.");
            return;
        }

        if (data.result.length === 0 && !this.needsClearing) {
            // no new data and current data in this._faction.data is already rendered
            return;
        }

        this.needsClearing = false;

        const old = this.oldestGUID;
        this.writeDataToHash(data, olderMsgs, ascendingTimestampOrder);
        const oldMsgsWereAdded = old !== this.oldestGUID;

        IITC.hooks.trigger(this.hookMessage, { raw: data, result: data.result, processed: this.data });

        this.render(oldMsgsWereAdded);
    }

    render(oldMsgsWereAdded: boolean) {
        this.renderData(this.data, "chat" + this.name, oldMsgsWereAdded, this.guids);
    }


    private genPostData(getOlderMsgs: boolean) {
        const b = clampLatLngBounds(window.map.getBounds());

        // set a current bounding box if none set so far
        if (!this.oldBoundingBox) this.oldBoundingBox = b;

        // to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box is not considered different
        const CHAT_BOUNDINGBOX_SAME_FACTOR = 0.1;
        // if the old and new box contain each other, after expanding by the factor, don't reset chat
        if (!(b.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(this.oldBoundingBox) && this.oldBoundingBox.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(b))) {
            log.log("Bounding Box changed, chat will be cleared (old: " + this.oldBoundingBox.toBBoxString() + "; new: " + b.toBBoxString() + ")");

            // NOTE: trigger for all chats?
            this.needsClearing = true;
            this.clearData();

            this.oldBoundingBox = b;
        }

        const ne = b.getNorthEast();
        const sw = b.getSouthWest();
        const data = {
            minLatE6: Math.round(sw.lat * 1000000),
            minLngE6: Math.round(sw.lng * 1000000),
            maxLatE6: Math.round(ne.lat * 1000000),
            maxLngE6: Math.round(ne.lng * 1000000),
            minTimestampMs: -1,
            maxTimestampMs: -1,
            tab: this.name,
            plextContinuationGuid: undefined,
            ascendingTimestampOrder: undefined
        };

        if (getOlderMsgs) {
            // ask for older chat when scrolling up
            data.maxTimestampMs = this.oldestTimestamp;
            data.plextContinuationGuid = this.oldestGUID;
        } else {
            // ask for newer chat
            const min = this.newestTimestamp;
            // the initial request will have both timestamp values set to -1, 
            // thus we receive the newest 50. After that, we will only receive
            // messages with a timestamp greater or equal to min above.
            // After resuming from idle, there might be more new messages than
            // desiredNumItems. So on the first request, we are not really up to
            // date. We will eventually catch up, as long as there are less new
            // messages than 50 per each refresh cycle.
            // A proper solution would be to query until no more new results are
            // returned.
            // Currently this edge case is not handled. Let’s see if this is a
            // problem in crowded areas.
            data.minTimestampMs = min;
            data.plextContinuationGuid = this.newestGUID;
            // when requesting with an actual minimum timestamp, request oldest rather than newest first.
            // this matches the stock intel site, and ensures no gaps when continuing after an extended idle period
            if (min > -1) data.ascendingTimestampOrder = true;
        }
        return data;
    }


    private writeDataToHash(newData: Intel.ChatCallback, isOlderMsgs, isAscendingOrder) {
        this.updateOldNewHash(newData, isOlderMsgs, isAscendingOrder);

        newData.result.forEach(json => {

            // avoid duplicates
            if (this.data.has(json[0])) return;

            const parsedData = this.parseMessageData(json);

            this.data.set(parsedData.guid, { html: this.renderMsgRow(parsedData), info: parsedData });
            if (isAscendingOrder) {
                this.guids.push(parsedData.guid);
            } else {
                this.guids.unshift(parsedData.guid);
            }
        });
    }

    private updateOldNewHash(newData: Intel.ChatCallback, isOlderMsgs, isAscendingOrder) {
        // track oldest + newest timestamps/GUID
        if (newData.result.length > 0) {
            let first = {
                guid: newData.result[0][0],
                time: newData.result[0][1]
            };
            let last = {
                guid: newData.result.at(-1)[0],
                time: newData.result.at(-1)[1]
            };
            if (isAscendingOrder) [first, last] = [last, first];

            if (this.oldestTimestamp === -1 || this.oldestTimestamp >= last.time) {
                if (isOlderMsgs || this.oldestTimestamp !== last.time) {
                    this.oldestTimestamp = last.time;
                    this.oldestGUID = last.guid;
                }
            }
            if (this.newestTimestamp === -1 || this.newestTimestamp <= first.time) {
                if (!isOlderMsgs || this.newestTimestamp !== first.time) {
                    this.newestTimestamp = first.time;
                    this.newestGUID = first.guid;
                }
            }
        }
    }

    private parseMessageData(data: Intel.ChatLine): MessageInfo {
        const categories: number = data[2].plext.categories;
        const isPublic = (categories & 1) === 1;
        const isSecure = (categories & 2) === 2;
        const isAlert = (categories & 4) === 4;

        const messageToPlayer = isAlert && (isPublic || isSecure);

        const time = data[1];
        const team = teamStr2Faction(data[2].plext.team);
        const auto = data[2].plext.plextType !== "PLAYER_GENERATED";
        const systemNarrowcast = data[2].plext.plextType === "SYSTEM_NARROWCAST";

        const markup = data[2].plext.markup;

        const player = { nick: "", team: FACTION.none };
        markup.forEach(ent => {
            switch (ent[0]) {
                case "SENDER": // user generated messages
                    player.nick = ent[1].plain.replace(/: $/, ""); // cut “: ” at end
                    player.team = team;
                    break;

                case "PLAYER": // automatically generated messages
                    player.nick = ent[1].plain;
                    player.team = teamStr2Faction(ent[1].team);
                    break;

                default:
                    break;
            }
        });

        return {
            guid: data[0],
            time,
            public: isPublic,
            secure: isSecure,
            alert: isAlert,
            messageToPlayer,
            type: data[2].plext.plextType,
            narrowcast: systemNarrowcast,
            auto,
            team,
            player,
            markup
        };
    }


    private renderMarkup(markup: Intel.MarkUp) {
        let message = "";

        this.transformMessage(markup);

        markup.forEach((ent, ind) => {
            switch (ent[0]) {
                case "SENDER":
                case "SECURE":
                    // skip as already handled
                    break;

                case "PLAYER": // automatically generated messages
                    if (ind > 0) message += this.renderMarkupEntity(ent); // don’t repeat nick directly
                    break;

                default:
                    // add other enitities whatever the type
                    message += this.renderMarkupEntity(ent);
                    break;
            }
        });
        return message;
    }


    private transformMessage(markup: Intel.MarkUp) {
        // "Agent "<player>"" destroyed the "<faction>" Link "
        if (markup.length > 4) {
            if (markup[3][0] === "FACTION" && markup[4][0] === "TEXT" && (markup[4][1].plain === " Link " || markup[4][1].plain === " Control Field @")) {
                (markup[4][1] as any).team = markup[3][1].team;
                markup.splice(3, 1);
            }
        }

        // skip "<faction> agent <player>"
        if (markup.length > 1) {
            if (markup[0][0] === "TEXT" && markup[0][1].plain === "Agent " && markup[1][0] === "PLAYER") {
                markup.splice(0, 2);
            }
        }

        // skip "agent <player>""
        if (markup.length > 2) {
            if (markup[0][0] === "FACTION" && markup[1][0] === "TEXT" && markup[1][1].plain === " agent " && markup[2][0] === "PLAYER") {
                markup.splice(0, 3);
            }
        }
    }


    private renderMarkupEntity(ent) {
        switch (ent[0]) {
            case "TEXT":
                return this.renderText(ent[1] as Intel.MarkUpTextType);
            case "PORTAL":
                return this.renderPortal(ent[1] as Intel.MarkUpPortalType);
            case "FACTION":
                return this.renderFactionEnt(ent[1] as Intel.MarkUpFactionType);
            case "SENDER":
                return this.renderPlayer(ent[1] as Intel.MarkUpPlayerType, false, true);
            case "PLAYER":
                return this.renderPlayer(ent[1] as Intel.MarkUpPlayerType);
            case "AT_PLAYER":
                return this.renderPlayer(ent[1] as Intel.MarkUpPlayerType, true);
            default:
        }
        return $("<div>").text(ent[0] + ":<" + ent[1].plain + ">").html();
    }

    //
    // Rendering primitive for markup, chat cells (td) and chat row (tr)
    //
    private renderText(text: Intel.MarkUpTextType) {
        if ((text as any).team) {
            let teamId = teamStr2Faction((text as any).team as Intel.TeamStr);
            if (teamId === FACTION.none) teamId = FACTION.MAC;
            const spanClass = FACTION_COLORS[teamId];
            return $("<div>")
                .append($("<span>", { class: spanClass, text: text.plain }))
                .html();
        }

        return $("<div>").text(text.plain).html().autoLink();
    }

    // Override portal names that are used over and over, such as 'US Post Office'
    private getChatPortalName(markup: Intel.MarkUpPortalType): string {
        let name = markup.name;
        if (name === "US Post Office") {
            const address = markup.address.split(",");
            name = "USPS: " + address[0];
        }
        return name;
    }

    private renderPortal(portal: Intel.MarkUpPortalType) {
        const lat = portal.latE6 / 1e6;
        const lng = portal.lngE6 / 1e6;
        const perma = makePermalink(L.latLng(lat, lng));
        const js = "window.selectPortalByLatLng(" + lat + ", " + lng + ");return false";
        return '<a onclick="' + js + '"'
            + ' title="' + portal.address + '"'
            + ' href="' + perma + '" class="help">'
            + this.getChatPortalName(portal)
            + "</a>";
    }

    private renderFactionEnt(faction: Intel.MarkUpFactionType) {
        const teamId = teamStr2Faction(faction.team);
        const name = FACTION_NAMES[teamId];
        const spanClass = FACTION_COLORS[teamId];
        return $("<div>").append($("<span>", { class: spanClass, text: name })).html();
    }

    private renderPlayer(player: Intel.MarkUpPlayerType, at: boolean = false, sender: boolean = false) {
        let name = player.plain;
        if (sender) {
            name = player.plain.replace(/: $/, "");
        } else if (at) {
            name = player.plain.replace(/^@/, "");
        }
        const thisToPlayer = name === PLAYER.name;
        const spanClass = thisToPlayer ? "pl_nudge_me" : (player.team + " pl_nudge_player");
        return $("<div>").append(
            $("<span>", {
                class: spanClass,
                click: (event: JQuery.ClickEvent) => IITC.chat.nicknameClicked(event, name),
                text: (at ? "@" : "") + name
            })).html();
    }


    private renderTimeCell(time: number, classNames: string) {
        const ta = unixTimeToHHmm(time);
        let tb = unixTimeToDateTimeString(time, true);

        // add <small> tags around the milliseconds
        tb = escapeHtmlSpecialChars(tb.slice(0, 19) + '<small class="milliseconds">' + tb.slice(19) + "</small>");
        return '<td><time class="' + classNames + '" title="' + tb + '" data-timestamp="' + time + '">' + ta + "</time></td>";
    }

    private renderNickCell(nick, classNames) {
        const i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
        return "<td>" + i[0] + '<mark class="' + classNames + '">' + nick + "</mark>" + i[1] + "</td>";
    }

    private renderMsgCell(message: string, classNames: string): string {
        return '<td class="' + classNames + '">' + message + "</td>";
    }


    private renderMsgRow(data: MessageInfo) {
        const timeClass = (data.messageToPlayer) ? "pl_nudge_date" : "";
        const timeCell = this.renderTimeCell(data.time, timeClass);

        const nickClasses = ["nickname"];
        if (FACTION_CSS[data.player.team]) {
            nickClasses.push(FACTION_CSS[data.player.team]);
        }
        // highlight things said/done by the player in a unique colour
        // (similar to @player mentions from others in the chat text itself)
        if (data.player.name === PLAYER.name) {
            nickClasses.push("pl_nudge_me");
        }
        const nickCell = this.renderNickCell(data.player.name, nickClasses.join(" "));

        const message = this.renderMarkup(data.markup);
        const messageClass = data.narrowcast ? "system_narrowcast" : "";
        const messageCell = this.renderMsgCell(message, messageClass);

        let className = "";
        if (!data.auto && data.public) {
            className = "public";
        } else if (!data.auto && data.secure) {
            className = "faction";
        }
        return '<tr data-guid="' + data.guid + '" class="' + className + '">' + timeCell + nickCell + messageCell + "</tr>";
    }


    private renderDivider(text) {
        return '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>";
    }

    // renders data from the data-hash to the element defined by the given
    // ID. Set 3rd argument to true if it is likely that old data has been
    // added. Latter is only required for scrolling.
    private renderData(data, element, likelyWereOldMsgs, sortedGuids) {
        const elm = $("#" + element);
        if (elm.is(":hidden")) {
            return;
        }

        // if sortedGuids is not specified (legacy), sort old to new
        // (disregarding server order)
        let vals = sortedGuids;
        if (vals === undefined) {
            vals = $.map(data, function (v, k) { return [[v[0], k]]; });
            vals = vals.sort(function (a, b) { return a[0] - b[0]; });
            vals = vals.map(function (v) { return v[1]; });
        }

        // render to string with date separators inserted
        let msgs = "";
        let prevTime = null;
        vals.forEach(guid => {
            const msg = data[guid];
            const nextTime = new Date(msg[0]).toLocaleDateString();
            if (prevTime && prevTime !== nextTime) {
                msgs += this.renderDivider(nextTime);
            }
            msgs += msg[2];
            prevTime = nextTime;
        });

        const firstRender = elm.is(":empty");
        const scrollBefore = scrollBottom(elm);
        elm.html("<table>" + msgs + "</table>");

        if (firstRender) {
            this.needsScrollTop = true;
        } else {
            this.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
        }

        if (this.needsScrollTop) {
            this.ignoreNextScroll = true;
            elm.scrollTop(999999);
            this.needsScrollTop = false;
        }
    }

    // contains the logic to keep the correct scroll position.
    private keepScrollPosition(box: JQuery, scrollBefore, isOldMsgs) {
        // If scrolled down completely, keep it that way so new messages can
        // be seen easily. If scrolled up, only need to fix scroll position
        // when old messages are added. New messages added at the bottom don’t
        // change the view and enabling this would make the chat scroll down
        // for every added message, even if the user wants to read old stuff.

        if (box.is(":hidden") && !isOldMsgs) {
            this.needsScrollTop = true;
            return;
        }

        if (scrollBefore === 0 || isOldMsgs) {
            this.ignoreNextScroll = true;
            box.scrollTop(box.scrollTop() + (scrollBottom(box) - scrollBefore));
        }
    }
}
