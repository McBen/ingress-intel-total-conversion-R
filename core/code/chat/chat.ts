import { IITC } from "../IITC";
import { postAjax, requests } from "../helper/send_request";
import { clampLatLngBounds, makePermalink, scrollBottom, uniqueArray } from "../helper/utils_misc";
import { idle } from "../map/idle";
import { FACTION, FACTION_COLORS, FACTION_CSS, FACTION_NAMES, teamStr2Faction } from "../constants";
import { Log, LogApp } from "../helper/log_apps";
import { player as PLAYER } from "../helper/player";
import { unixTimeToDateTimeString, unixTimeToHHmm } from "../helper/times";
const log = Log(LogApp.Chat);


// eslint-disable-next-line unicorn/prefer-module
require("autolink-js");
declare global {
    // eslint-disable-next-line id-blacklist
    interface String {
        autoLink(): string;
    }
}


// how many pixels to the top before requesting new data
const CHAT_REQUEST_SCROLL_TOP = 200;


const enum TAB {
    all = "all",
    faction = "faction",
    alerts = "alerts"
}


export class Chat {


    init(): void {
        // TODO: use IITCOptions
        const lastTab = localStorage.getItem("iitc-chat-tab");
        if (lastTab) {
            this.chooseTab(lastTab as TAB);
        }

        $("#chatcontrols, #chat, #chatinput").show();

        $("#chatcontrols a:first").on("click", () => this.toggle());
        $("#chatcontrols a:contains('all')").on("click", () => this.chooseTab(TAB.all));
        $("#chatcontrols a:contains('faction')").on("click", () => this.chooseTab(TAB.faction));
        $("#chatcontrols a:contains('alerts')").on("click", () => this.chooseTab(TAB.alerts));

        $("#chatinput").on("click", () => $("#chatinput input").focus());


        this.setupTime();
        this.setupPosting();

        $("#chatfaction").on("scroll", (event: JQuery.ScrollEvent) => {
            const t = $(event.target);
            if (t.data("ignoreNextScroll")) return t.data("ignoreNextScroll", false);
            if (t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) this.requestFaction(true);
            if (scrollBottom(t) === 0) this.requestFaction(false);
        });

        $("#chatall").on("scroll", (event: JQuery.ScrollEvent) => {
            const t = $(event.target);
            if (t.data("ignoreNextScroll")) return t.data("ignoreNextScroll", false);
            if (t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) this.requestPublic(true);
            if (scrollBottom(t) === 0) this.requestPublic(false);
        });

        $("#chatalerts").on("scroll", (event: JQuery.ScrollEvent) => {
            const t = $(event.target);
            if (t.data("ignoreNextScroll")) return t.data("ignoreNextScroll", false);
            if (t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) this.requestAlerts(true);
            if (scrollBottom(t) === 0) this.requestAlerts(false);
        });

        requests.addRefreshFunction(this.request);

        $("#chatinput mark").addClass(FACTION_CSS[PLAYER.team]);

        $(document).on("click", ".nickname", (event: JQuery.ClickEvent) => {
            return this.nicknameClicked(event, $(event.target).text());
        });
    }


    private setupTime() {
        const inputTime = $("#chatinput time");
        const updateTime = () => {
            if (idle.isIdle()) return;
            const d = new Date();
            const h = d.getHours() + ""; if (h.length === 1) h = "0" + h;
            const m = d.getMinutes() + ""; if (m.length === 1) m = "0" + m;
            inputTime.text(h + ":" + m);

            // update ON the minute (1ms after)
            setTimeout(updateTime, (60 - d.getSeconds()) * 1000 + 1);
        };
        updateTime();

        idle.addResumeFunction(updateTime);
    }


    private setupPosting() {
        if (!isSmartphone()) {
            $("#chatinput input").on("keydown", (event: JQuery.KeyDownEvent) => {
                if (event.key === "Enter") {
                    this.postMsg();
                    event.preventDefault();
                } else if (event.key === "Tab") {
                    event.preventDefault();
                    this.handleTabCompletion();
                }
            });
        }

        $("#chatinput").on("submit", (event: JQuery.SubmitEvent) => {
            event.preventDefault();
            this.postMsg();
        });
    }



    private chooseTab(tab: TAB) {
        if (tab !== TAB.all && tab !== TAB.faction && tab !== TAB.alerts) {
            log.warn(`chat tab "${tab as string}" requested - but only "all", "faction" and "alerts" are valid`);
            tab = TAB.all;
        }

        const oldTab = this.getActive();
        localStorage.setItem("iitc-chat-tab", tab);

        const mark = $("#chatinput mark");
        const input = $("#chatinput input");

        $("#chatcontrols .active").removeClass("active");
        $("#chatcontrols a:contains('" + tab + "')").addClass("active");

        // only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a tab change
        if (tab !== oldTab) requests.startRefreshTimeout(0.1 * 1000);

        $("#chat > div").hide();

        const elm = $("#chat" + tab);
        elm.show();

        switch (tab) {
            case "faction":
                input.css("color", "");
                mark.css("color", "");
                mark.text("tell faction:");

                this.renderFaction(false);
                break;

            case "all":
                input.css("cssText", "color: #f66 !important");
                mark.css("cssText", "color: #f66 !important");
                mark.text("broadcast:");

                this.renderPublic(false);
                break;

            case "alerts":
                mark.css("cssText", "color: #bbb !important");
                input.css("cssText", "color: #bbb !important");
                mark.text("tell Jarvis:");

                this.renderAlerts(false);
                break;
        }
    }

    private getActive(): TAB {
        return $("#chatcontrols .active").text() as TAB;
    }


    private toggle() {
        const c = $("#chat, #chatcontrols");
        if (c.hasClass("expand")) {
            c.removeClass("expand");
            const div = $("#chat > div:visible");
            div.data("ignoreNextScroll", true);
            div.scrollTop(99999999); // scroll to bottom
            $(".leaflet-control").removeClass("chat-expand");
        } else {
            c.addClass("expand");
            $(".leaflet-control").addClass("chat-expand");
            this.needMoreMessages();
        }
    }


    private postMsg() {
        const c = this.getActive();
        if (c === TAB.alerts) {
            return alert("Jarvis: A strange game. The only winning move is not to play. " +
                "How about a nice game of chess?\n(You can't chat to the 'alerts' channel!)");
        }

        // unknown tab, ignore
        if (c !== TAB.all && c !== TAB.faction) {
            return;
        }

        const msg = ($("#chatinput input").val() as string).trim();
        if (!msg || msg === "") return;

        const latlng = window.map.getCenter();

        const data = {
            message: msg,
            latE6: Math.round(latlng.lat * 1e6),
            lngE6: Math.round(latlng.lng * 1e6),
            tab: c
        };

        const errMsg = "Your message could not be delivered. You can copy&" +
            "paste it here and try again if you want:\n\n" + msg;

        postAjax("sendPlext", data,
            (response) => {
                if (response.error) alert(errMsg);
                // only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a send message
                requests.startRefreshTimeout(0.1 * 1000);
            },
            () => {
                alert(errMsg);
            }
        );

        $("#chatinput input").val("");
    }


    private handleTabCompletion() {
        const el = $("#chatinput input").get(0) as HTMLInputElement;
        const curPos = el.selectionStart;
        const text = el.value;
        const word = text.slice(0, curPos).replace(/.*\b([a-z0-9-_])/, "$1").toLowerCase();

        const listElements = $("#chat > div:visible mark");
        let list = listElements.map(function (ind, mark) { return $(mark).text() }) as unknown as string[];
        list = uniqueArray(list);

        let nick = null;
        for (let i = 0; i < list.length; i++) {
            if (!list[i].toLowerCase().startsWith(word)) continue;
            if (nick && nick !== list[i]) {
                log.warn("More than one nick matches, aborting. (" + list[i] + " vs " + nick + ")");
                return;
            }
            nick = list[i];
        }
        if (!nick) {
            return;
        }

        const posStart = curPos - word.length;
        const newText = text.substring(0, posStart);
        const atPresent = text.substring(posStart - 1, posStart) === "@";
        newText += (atPresent ? "" : "@") + nick + " ";
        newText += text.substring(curPos);
        el.value = newText;
    }


    request = (): void => {
        const channel = this.tabToChannel(this.getActive());
        if (channel === "faction") {
            this.requestFaction(false);
        }
        if (channel === "all") {
            this.requestPublic(false);
        }
        if (channel === "alerts") {
            this.requestAlerts(false);
        }
    }

    private tabToChannel(tab: TAB): string {
        if (tab === TAB.faction) return "faction";
        if (tab === TAB.alerts) return "alerts";
        return "all";
    }



    /**
     * checks if there are enough messages in the selected chat tab and
     * loads more if not.
     */
    private needMoreMessages() {
        const activeTab = this.getActive();
        if (activeTab !== "all" && activeTab !== "faction" && activeTab !== "alerts") {
            return;
        }

        const activeChat = $("#chat > :visible");
        if (activeChat.length === 0) return;

        const hasScrollbar = scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0;
        const nearTop = activeChat.scrollTop() <= CHAT_REQUEST_SCROLL_TOP;
        if (hasScrollbar && !nearTop) return;

        if (activeTab === "faction") {
            this.requestFaction(true);
        } else {
            this.requestPublic(true);
        }
    }


    //
    // faction
    // TODO create own classes
    private _requestFactionRunning = false;
    private _faction = { data: {}, guids: [], oldestTimestamp: -1, newestTimestamp: -1, oldestGUID: undefined, newestGUID: undefined };

    private requestFaction(getOlderMsgs, isRetry = false) {
        if (this._requestFactionRunning && !isRetry) return;
        if (idle.isIdle()) return renderUpdateStatus();
        this._requestFactionRunning = true;
        $("#chatcontrols a:contains('faction')").addClass("loading");

        const d = this.genPostData("faction", this._faction, getOlderMsgs);
        const r = postAjax(
            "getPlexts",
            d,
            function (data, textStatus, jqXHR) { this.handleFaction(data, getOlderMsgs, d.ascendingTimestampOrder); },
            isRetry
                ? function () { this._requestFactionRunning = false; }
                : function () { this.requestFaction(getOlderMsgs, true) }
        );
    }


    handleFaction(data, olderMsgs, ascendingTimestampOrder) {
        this._requestFactionRunning = false;
        $("#chatcontrols a:contains('faction')").removeClass("loading");

        if (!data || !data.result) {
            // TODO: mapStatus.showError("faction chat error");
            log.warn("faction chat error. Waiting for next auto-refresh.");
            return
        }

        if (!data.result.length && !$("#chatfaction").data("needsClearing")) {
            // no new data and current data in this._faction.data is already rendered
            return;
        }

        $("#chatfaction").data("needsClearing", null);

        const old = this._faction.oldestGUID;
        this.writeDataToHash(data, this._faction, false, olderMsgs, ascendingTimestampOrder);
        const oldMsgsWereAdded = old !== this._faction.oldestGUID;

        IITC.hooks.trigger("factionChatDataAvailable", { raw: data, result: data.result, processed: this._faction.data });

        this.renderFaction(oldMsgsWereAdded);
    }

    renderFaction(oldMsgsWereAdded) {
        this.renderData(this._faction.data, "chatfaction", oldMsgsWereAdded, this._faction.guids);
    }



    //
    // all
    //
    private _requestPublicRunning = false;
    private _public = { data: {}, guids: [], oldestTimestamp: -1, newestTimestamp: -1, oldestGUID: undefined, newestGUID: undefined };

    requestPublic(getOlderMsgs, isRetry = false) {
        if (this._requestPublicRunning && !isRetry) return;
        if (idle.isIdle()) return renderUpdateStatus();
        this._requestPublicRunning = true;
        $("#chatcontrols a:contains('all')").addClass("loading");

        const d = this.genPostData("all", this._public, getOlderMsgs);
        const r = postAjax(
            "getPlexts",
            d,
            function (data, textStatus, jqXHR) { this.handlePublic(data, getOlderMsgs, d.ascendingTimestampOrder); },
            isRetry
                ? function () { this._requestPublicRunning = false; }
                : function () { this.requestPublic(getOlderMsgs, true) }
        );
    }

    handlePublic(data, olderMsgs, ascendingTimestampOrder) {
        this._requestPublicRunning = false;
        $("#chatcontrols a:contains('all')").removeClass("loading");

        if (!data || !data.result) {
            // TODO: mapStatus.showError("public chat error");
            log.warn("public chat error. Waiting for next auto-refresh.");
            return
        }

        if (!data.result.length && !$("#chatall").data("needsClearing")) {
            // no new data and current data in this._public.data is already rendered
            return;
        }

        $("#chatall").data("needsClearing", null);

        const old = this._public.oldestGUID;
        this.writeDataToHash(data, this._public, olderMsgs, ascendingTimestampOrder);
        const oldMsgsWereAdded = old !== this._public.oldestGUID;

        IITC.hooks.trigger("publicChatDataAvailable", { raw: data, result: data.result, processed: this._public.data });

        this.renderPublic(oldMsgsWereAdded);

    }

    renderPublic(oldMsgsWereAdded) {
        this.renderData(this._public.data, "chatall", oldMsgsWereAdded, this._public.guids);
    }


    //
    // alerts
    //
    private _requestAlertsRunning = false;
    private _alerts = { data: {}, guids: [], oldestTimestamp: -1, newestTimestamp: -1, oldestGUID: undefined, newestGUID: undefined };

    requestAlerts(getOlderMsgs, isRetry = false) {
        if (this._requestAlertsRunning && !isRetry) return;
        if (idle.isIdle()) return renderUpdateStatus();
        this._requestAlertsRunning = true;
        $("#chatcontrols a:contains('alerts')").addClass("loading");

        const d = this.genPostData("alerts", this._alerts, getOlderMsgs);
        const r = postAjax(
            "getPlexts",
            d,
            function (data, textStatus, jqXHR) { this.handleAlerts(data, getOlderMsgs, d.ascendingTimestampOrder); },
            isRetry
                ? function () { this._requestAlertsRunning = false; }
                : function () { this.requestAlerts(getOlderMsgs, true) }
        );
    }

    handleAlerts(data, olderMsgs, ascendingTimestampOrder) {
        this._requestAlertsRunning = false;
        $("#chatcontrols a:contains('alerts')").removeClass("loading");

        if (!data || !data.result) {
            // TODO: mapStatus.showError("pualertsblic chat error");
            log.warn("alerts chat error. Waiting for next auto-refresh.");
            return
        }

        if (data.result.length === 0) return;

        const old = this._alerts.oldestTimestamp;
        this.writeDataToHash(data, this._alerts, olderMsgs, ascendingTimestampOrder);
        const oldMsgsWereAdded = old !== this._alerts.oldestTimestamp;

        // hook for alerts - API change planned here for next refactor
        IITC.hooks.trigger("alertsChatDataAvailable", { raw: data, result: data.result, processed: this._alerts.data });

        this.renderAlerts(oldMsgsWereAdded);
    }

    renderAlerts(oldMsgsWereAdded) {
        this.renderData(this._alerts.data, "chatalerts", oldMsgsWereAdded, this._alerts.guids);
    }


    //
    // clear management
    //
    private _oldBBox = null;
    private genPostData(channel, storageHash, getOlderMsgs) {
        if (typeof channel !== "string") {
            throw new Error("API changed: isFaction flag now a channel string - all, faction, alerts");
        }

        const b = clampLatLngBounds(window.map.getBounds());

        // set a current bounding box if none set so far
        if (!this._oldBBox) this._oldBBox = b;

        // to avoid unnecessary chat refreshes, a small difference compared to the previous bounding box
        // is not considered different
        const CHAT_BOUNDINGBOX_SAME_FACTOR = 0.1;
        // if the old and new box contain each other, after expanding by the factor, don't reset chat
        if (!(b.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(this._oldBBox) && this._oldBBox.pad(CHAT_BOUNDINGBOX_SAME_FACTOR).contains(b))) {
            log.log("Bounding Box changed, chat will be cleared (old: " + this._oldBBox.toBBoxString() + "; new: " + b.toBBoxString() + ")");

            $("#chat > div").data("needsClearing", true);

            // need to reset these flags now because clearing will only occur
            // after the request is finished – i.e. there would be one almost
            // useless request.
            this._faction.data = {};
            this._faction.guids = [];
            this._faction.oldestTimestamp = -1;
            this._faction.newestTimestamp = -1;
            this._faction.oldestGUID = undefined;
            this._faction.newestGUID = undefined;

            this._public.data = {};
            this._public.guids = [];
            this._public.oldestTimestamp = -1;
            this._public.newestTimestamp = -1;
            this._public.oldestGUID = undefined;
            this._public.newestGUID = undefined;

            this._alerts.data = {};
            this._alerts.guids = [];
            this._alerts.oldestTimestamp = -1;
            this._alerts.newestTimestamp = -1;
            this._alerts.oldestGUID = undefined;
            this._alerts.newestGUID = undefined;

            this._oldBBox = b;
        }

        const ne = b.getNorthEast();
        const sw = b.getSouthWest();
        const data = {
            minLatE6: Math.round(sw.lat * 1e6),
            minLngE6: Math.round(sw.lng * 1e6),
            maxLatE6: Math.round(ne.lat * 1e6),
            maxLngE6: Math.round(ne.lng * 1e6),
            minTimestampMs: -1,
            maxTimestampMs: -1,
            tab: channel,
            plextContinuationGuid: undefined,
            ascendingTimestampOrder: undefined,
        };

        if (getOlderMsgs) {
            // ask for older chat when scrolling up
            data.maxTimestampMs = storageHash.oldestTimestamp;
            data.plextContinuationGuid = storageHash.oldestGUID;
        } else {
            // ask for newer chat
            const min = storageHash.newestTimestamp;
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
            data.plextContinuationGuid = storageHash.newestGUID;
            // when requesting with an actual minimum timestamp, request oldest rather than newest first.
            // this matches the stock intel site, and ensures no gaps when continuing after an extended idle period
            if (min > -1) data.ascendingTimestampOrder = true;
        }
        return data;
    };



    private nicknameClicked(event, nickname) {
        const hookData = { event: event, nickname: nickname };

        if (IITC.hooks.trigger("nicknameClicked", hookData)) {
            this.addNickname("@" + nickname);
        }

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    private addNickname(nick) {
        const c = document.getElementById("chattext") as HTMLInputElement;
        c.value = [c.value.trim(), nick].join(" ").trim() + " ";
        c.focus()
    }

    private updateOldNewHash(newData, storageHash, isOlderMsgs, isAscendingOrder) {
        // track oldest + newest timestamps/GUID
        if (newData.result.length > 0) {
            let first = {
                guid: newData.result[0][0],
                time: newData.result[0][1]
            };
            let last = {
                guid: newData.result[newData.result.length - 1][0],
                time: newData.result[newData.result.length - 1][1]
            };
            if (isAscendingOrder) {
                const temp = first;
                first = last;
                last = temp;
            }
            if (storageHash.oldestTimestamp === -1 || storageHash.oldestTimestamp >= last.time) {
                if (isOlderMsgs || storageHash.oldestTimestamp !== last.time) {
                    storageHash.oldestTimestamp = last.time;
                    storageHash.oldestGUID = last.guid;
                }
            }
            if (storageHash.newestTimestamp === -1 || storageHash.newestTimestamp <= first.time) {
                if (!isOlderMsgs || storageHash.newestTimestamp !== first.time) {
                    storageHash.newestTimestamp = first.time;
                    storageHash.newestGUID = first.guid;
                }
            }
        }
    }


    private parseMsgData(data) {
        const categories = data[2].plext.categories;
        const isPublic = (categories & 1) === 1;
        const isSecure = (categories & 2) === 2;
        const msgAlert = (categories & 4) === 4;

        const msgToPlayer = msgAlert && (isPublic || isSecure);

        const time = data[1];
        let team = teamStr2Faction(data[2].plext.team);
        const auto = data[2].plext.plextType !== "PLAYER_GENERATED";
        const systemNarrowcast = data[2].plext.plextType === "SYSTEM_NARROWCAST";

        const markup = data[2].plext.markup;

        let nick = "";
        markup.forEach(function (ent) {
            switch (ent[0]) {
                case "SENDER": // user generated messages
                    nick = ent[1].plain.replace(/: $/, ""); // cut “: ” at end
                    break;

                case "PLAYER": // automatically generated messages
                    nick = ent[1].plain;
                    team = teamStr2Faction(ent[1].team);
                    break;

                default:
                    break;
            }
        });

        return {
            guid: data[0],
            time: time,
            public: isPublic,
            secure: isSecure,
            alert: msgAlert,
            msgToPlayer: msgToPlayer,
            type: data[2].plext.plextType,
            narrowcast: systemNarrowcast,
            auto: auto,
            player: {
                name: nick,
                team: team,
            },
            markup: markup,
        };
    };

    private writeDataToHash(newData, storageHash, isOlderMsgs, isAscendingOrder) {
        this.updateOldNewHash(newData, storageHash, isOlderMsgs, isAscendingOrder);

        newData.result.forEach(function (json) {
            // avoid duplicates
            if (json[0] in storageHash.data) {
                return true;
            }

            const parsedData = this.parseMsgData(json);

            // format: timestamp, autogenerated, HTML message, nick, additional data (parsed, plugin specific data...)
            storageHash.data[parsedData.guid] = [parsedData.time, parsedData.auto, this.renderMsgRow(parsedData), parsedData.player.name, parsedData];
            if (isAscendingOrder) {
                storageHash.guids.push(parsedData.guid);
            } else {
                storageHash.guids.unshift(parsedData.guid);
            }
        });
    };

    //
    // Rendering primitive for markup, chat cells (td) and chat row (tr)
    //
    private renderText(text) {
        if (text.team) {
            let teamId = teamStr2Faction(text.team);
            if (teamId === FACTION.none) teamId = FACTION.MAC;
            const spanClass = FACTION_COLORS[teamId];
            return $("<div>")
                .append($("<span>", { class: spanClass, text: text.plain }))
                .html();
        }

        return $("<div>").text(text.plain).html().autoLink();
    };

    // Override portal names that are used over and over, such as 'US Post Office'
    private getChatPortalName(markup) {
        let name = markup.name;
        if (name === "US Post Office") {
            const address = markup.address.split(",");
            name = "USPS: " + address[0];
        }
        return name;
    };

    private renderPortal(portal) {
        const lat = portal.latE6 / 1e6, lng = portal.lngE6 / 1e6;
        const perma = makePermalink(L.latLng(lat, lng));
        const js = "window.selectPortalByLatLng(" + lat + ", " + lng + ");return false";
        return '<a onclick="' + js + '"'
            + ' title="' + portal.address + '"'
            + ' href="' + perma + '" class="help">'
            + this.getChatPortalName(portal)
            + "</a>";
    };

    private renderFactionEnt(faction) {
        const teamId = teamStr2Faction(faction.team);
        const name = FACTION_NAMES[teamId];
        const spanClass = FACTION_COLORS[teamId];
        return $("<div>").append($("<span>", { class: spanClass, text: name })).html();
    };

    private renderPlayer(player, at: boolean = false, sender: boolean = false) {
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
                click: (event: JQuery.ClickEvent) => this.nicknameClicked(event, name),
                text: (at ? "@" : "") + name
            })).html();
    };


    private renderMarkupEntity(ent) {
        switch (ent[0]) {
            case "TEXT":
                return this.renderText(ent[1]);
            case "PORTAL":
                return this.renderPortal(ent[1]);
            case "FACTION":
                return this.renderFactionEnt(ent[1]);
            case "SENDER":
                return this.renderPlayer(ent[1], false, true);
            case "PLAYER":
                return this.renderPlayer(ent[1]);
            case "AT_PLAYER":
                return this.renderPlayer(ent[1], true);
            default:
        }
        return $("<div>").text(ent[0] + ":<" + ent[1].plain + ">").html();
    }

    private renderMarkup(markup) {
        let msg = "";

        this.transformMessage(markup);

        markup.forEach(function (ent, ind) {
            switch (ent[0]) {
                case "SENDER":
                case "SECURE":
                    // skip as already handled
                    break;

                case "PLAYER": // automatically generated messages
                    if (ind > 0) msg += this.renderMarkupEntity(ent); // don’t repeat nick directly
                    break;

                default:
                    // add other enitities whatever the type
                    msg += this.renderMarkupEntity(ent);
                    break;
            }
        });
        return msg;
    }


    private transformMessage(markup) {
        // "Agent "<player>"" destroyed the "<faction>" Link "
        if (markup.length > 4) {
            if (markup[3][0] === "FACTION" && markup[4][0] === "TEXT" && (markup[4][1].plain === " Link " || markup[4][1].plain === " Control Field @")) {
                markup[4][1].team = markup[3][1].team;
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

    private renderTimeCell(time, classNames) {
        const ta = unixTimeToHHmm(time);
        let tb = unixTimeToDateTimeString(time, true);

        // add <small> tags around the milliseconds
        tb = (tb.slice(0, 19) + '<small class="milliseconds">' + tb.slice(19) + "</small>")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        return '<td><time class="' + classNames + '" title="' + tb + '" data-timestamp="' + time + '">' + ta + "</time></td>";
    }

    private renderNickCell(nick, classNames) {
        const i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
        return "<td>" + i[0] + '<mark class="' + classNames + '">' + nick + "</mark>" + i[1] + "</td>";
    }

    private renderMsgCell(msg, classNames) {
        return '<td class="' + classNames + '">' + msg + "</td>";
    }


    private renderMsgRow(data) {
        const timeClass = (data.msgToPlayer) ? "pl_nudge_date" : "";
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

        const msg = this.renderMarkup(data.markup);
        const msgClass = data.narrowcast ? "system_narrowcast" : "";
        const msgCell = this.renderMsgCell(msg, msgClass);

        let className = "";
        if (!data.auto && data.public) {
            className = "public";
        } else if (!data.auto && data.secure) {
            className = "faction";
        }
        return '<tr data-guid="' + data.guid + '" class="' + className + '">' + timeCell + nickCell + msgCell + "</tr>";
    };

    // legacy rendering, not used internaly, but left there for backward compatibilty in case a plugin uses it directly
    private renderMsg(msg, nick, time, team, msgToPlayer, systemNarrowcast) {
        const ta = unixTimeToHHmm(time);
        let tb = unixTimeToDateTimeString(time, true);
        // add <small> tags around the milliseconds
        tb = (tb.slice(0, 19) + '<small class="milliseconds">' + tb.slice(19) + "</small>")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

        // help cursor via “#chat time”
        let t = '<time title="' + tb + '" data-timestamp="' + time + '">' + ta + "</time>";
        if (msgToPlayer) {
            t = '<div class="pl_nudge_date">' + t + '</div><div class="pl_nudge_pointy_spacer"></div>';
        }
        if (systemNarrowcast) {
            msg = '<div class="system_narrowcast">' + msg + "</div>";
        }
        let color = FACTION_COLORS[team];
        // highlight things said/done by the player in a unique colour (similar to @player mentions from others in the chat text itself)
        if (nick === PLAYER.name) {
            color = "#fd6";
        }
        const s = 'style="cursor:pointer; color:' + color + '"';
        const i = ['<span class="invisep">&lt;</span>', '<span class="invisep">&gt;</span>'];
        return "<tr><td>" + t + "</td><td>" + i[0] + '<mark class="nickname" ' + s + ">" + nick + "</mark>" + i[1] + "</td><td>" + msg + "</td></tr>";
    }

    private renderDivider(text) {
        return '<tr class="divider"><td><hr></td><td>' + text + "</td><td><hr></td></tr>";
    };

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
        vals.forEach(function (guid) {
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
            elm.data("needsScrollTop", 99999999);
        } else {
            this.keepScrollPosition(elm, scrollBefore, likelyWereOldMsgs);
        }

        if (elm.data("needsScrollTop")) {
            elm.data("ignoreNextScroll", true);
            elm.scrollTop(elm.data("needsScrollTop"));
            elm.data("needsScrollTop", null);
        }
    };


    private show(name) {
        window.isSmartphone()
            ? $("#updatestatus").hide()
            : $("#updatestatus").show();
        $("#chat, #chatinput").show();

        this.chooseTab(name);
    }


    // contains the logic to keep the correct scroll position.
    private keepScrollPosition(box, scrollBefore, isOldMsgs) {
        // If scrolled down completely, keep it that way so new messages can
        // be seen easily. If scrolled up, only need to fix scroll position
        // when old messages are added. New messages added at the bottom don’t
        // change the view and enabling this would make the chat scroll down
        // for every added message, even if the user wants to read old stuff.

        if (box.is(":hidden") && !isOldMsgs) {
            box.data("needsScrollTop", 99999999);
            return;
        }

        if (scrollBefore === 0 || isOldMsgs) {
            box.data("ignoreNextScroll", true);
            box.scrollTop(box.scrollTop() + (scrollBottom(box) - scrollBefore));
        }
    }

}
