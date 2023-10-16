
/* eslint-disable max-classes-per-file */
import { IITC } from "../IITC";
import { postAjax, requests } from "../helper/send_request";
import { scrollBottom, uniqueArray } from "../helper/utils_misc";
import { idle } from "../map/idle";
import { FACTION_CSS } from "../constants";
import { player as PLAYER } from "../helper/player";
import { ChatChannel } from "./chat_channel";
import { Log, LogApp } from "../helper/log_apps";
import { GLOPT, IITCOptions } from "../helper/options";
export const log = Log(LogApp.Chat);


// how many pixels to the top before requesting new data
const CHAT_REQUEST_SCROLL_TOP = 200;

const enum TAB {
    all = 0,
    faction = 1,
    alerts = 2
}


class ChatChannelAll extends ChatChannel {
    public name = "all";
    public hookMessage = "publicChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        input.css("cssText", "color: #f66 !important");
        mark.css("cssText", "color: #f66 !important");
        mark.text("broadcast:");
    }
}


class ChatChannelFaction extends ChatChannel {
    public name = "faction";
    public hookMessage = "factionChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        input.css("color", "");
        mark.css("color", "");
        mark.text("tell faction:");
    }
}


class ChatChannelAlert extends ChatChannel {
    public name = "alert";
    public hookMessage = "alertsChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        mark.css("cssText", "color: #bbb !important");
        input.css("cssText", "color: #bbb !important");
        mark.text("tell Jarvis:");
    }
}


export class Chat {

    private channels: ChatChannel[] = [];

    init(): void {

        this.channels = [
            new ChatChannelAll(), // TAB.all
            new ChatChannelFaction(), // TAB.daction
            new ChatChannelAlert() // TAB.alerts
        ];

        const lastTab = IITCOptions.getSafe(GLOPT.CHAT_TAB, TAB.all);
        if (lastTab) {
            this.chooseTab(lastTab);
        }


        $("#chatcontrols, #chat, #chatinput").show();

        $("#chatcontrols a:first").on("click", () => this.toggle());
        $("#chatcontrols a:contains('all')").on("click", () => this.chooseTab(TAB.all));
        $("#chatcontrols a:contains('faction')").on("click", () => this.chooseTab(TAB.faction));
        $("#chatcontrols a:contains('alerts')").on("click", () => this.chooseTab(TAB.alerts));

        $("#chatinput").on("click", () => $("#chatinput input").focus());


        this.setupTime();
        this.setupPosting();

        $("#chatfaction").on("scroll", (event: JQuery.ScrollEvent) => this.onScroll(event, this.channels[TAB.faction]));
        $("#chatall").on("scroll", (event: JQuery.ScrollEvent) => this.onScroll(event, this.channels[TAB.all]));
        $("#chatalerts").on("scroll", (event: JQuery.ScrollEvent) => this.onScroll(event, this.channels[TAB.alerts]));

        requests.addRefreshFunction(this.request);

        $("#chatinput mark").addClass(FACTION_CSS[PLAYER.team]);

        $(document).on("click", ".nickname", (event: JQuery.ClickEvent) => {
            return this.nicknameClicked(event, $(event.target).text());
        });
    }

    monitorData(id: string, channel: string) {
        let tab = TAB.all;
        if (channel === "faction") tab = TAB.faction;
        else if (channel === "alerts") tab = TAB.alerts;
        else if (channel !== "all") log.error("unknown chat to watch: " + channel);

        this.channels[tab].watchChannel(id);
    }

    private onScroll(event: JQuery.ScrollEvent, channel: ChatChannel): void {
        const t = $(event.target);
        if (channel.ignoreNextScroll) {
            channel.ignoreNextScroll = false;
            return;
        }
        if (t.scrollTop() < CHAT_REQUEST_SCROLL_TOP) channel.request(true);
        if (scrollBottom(t) === 0) channel.request(false);
    }


    private setupTime() {
        const inputTime = $("#chatinput time");
        const updateTime = () => {
            if (idle.isIdle()) return;
            const d = new Date();
            let h = d.getHours() + "";
            if (h.length === 1) h = "0" + h;
            let m = d.getMinutes() + "";
            if (m.length === 1) m = "0" + m;
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

        IITCOptions.set(GLOPT.CHAT_TAB, tab);
        const oldTab = this.getActive();

        const mark = $("#chatinput mark");
        const input = $("#chatinput input");

        $("#chatcontrols .active").removeClass("active");
        $("#chatcontrols a:contains('" + tab + "')").addClass("active");

        // only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a tab change
        if (tab !== oldTab) requests.startRefreshTimeout(0.1 * 1000);

        $("#chat > div").hide();

        const elm = $("#chat" + this.tabToName(tab));
        elm.show();

        const channel = this.channels[tab];
        channel.initInput(mark, input);
        channel.render(false);
    }

    private tabToName(tab: TAB): string {
        switch (tab) {
            case TAB.faction: return "faction";
            case TAB.all: return "all";
            case TAB.alerts: return "alerts";
        }
    }


    private getActive(): TAB {
        const activeTab = $("#chatcontrols .active").text();
        switch (activeTab) {
            case "faction": return TAB.faction;
            case "alert": return TAB.alerts;
            // case "all":
            default:
                return TAB.all;
        }
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

        const message = ($("#chatinput input").val() as string).trim();
        if (!message || message === "") return;

        const latlng = window.map.getCenter();

        const data = {
            message,
            latE6: Math.round(latlng.lat * 1e6),
            lngE6: Math.round(latlng.lng * 1e6),
            tab: c
        };

        const errorMessage = "Your message could not be delivered. You can copy&" +
            "paste it here and try again if you want:\n\n" + message;

        postAjax("sendPlext", data,
            response => {
                if (response.error) alert(errorMessage);
                // only chat uses the refresh timer stuff, so a perfect way of forcing an early refresh after a send message
                requests.startRefreshTimeout(0.1 * 1000);
            },
            () => {
                alert(errorMessage);
            }
        );

        $("#chatinput input").val("");
    }


    private handleTabCompletion() {
        const element = $("#chatinput input").get(0) as HTMLInputElement;
        const currentPos = element.selectionStart;
        const text = element.value;
        const word = text.slice(0, currentPos).replace(/.*\b([a-z0-9-_])/, "$1").toLowerCase();

        const listElements = $("#chat > div:visible mark");
        let list = listElements.map(function (ind, mark) { return $(mark).text() }) as unknown as string[];
        list = uniqueArray(list);

        const nicks = list.filter(l => l.toLowerCase().startsWith(word));
        if (nicks.length > 1) {
            log.warn("More than one nick matches, aborting. (" + list.join(",") + ")");
            return;
        }
        if (nicks.length === 0) {
            return;
        }

        const nick = nicks[0]
        const posStart = currentPos - word.length;
        let newText = text.slice(0, Math.max(0, posStart));
        const atPresent = text.slice(posStart - 1, posStart) === "@";
        newText += (atPresent ? "" : "@") + nick + " ";
        newText += text.slice(Math.max(0, currentPos));
        element.value = newText;
    }


    request = (): void => {
        const channel = this.getActive();

        this.channels.forEach((ch, index) => {
            if (ch.isWatched() || (index as TAB) === channel) {
                this.channels[channel].request(false);
            };
        })
    }


    /**
     * checks if there are enough messages in the selected chat tab and
     * loads more if not.
     */
    private needMoreMessages() {
        const activeTab = this.getActive();

        const activeChat = $("#chat > :visible");
        if (activeChat.length === 0) return;

        const hasScrollbar = scrollBottom(activeChat) !== 0 || activeChat.scrollTop() !== 0;
        const nearTop = activeChat.scrollTop() <= CHAT_REQUEST_SCROLL_TOP;
        if (hasScrollbar && !nearTop) return;

        this.channels[activeTab].request(true);
    }



    nicknameClicked(event: JQuery.ClickEvent, nickname: string): boolean {
        const hookData = { event, nickname };
        if (IITC.hooks.trigger("nicknameClicked", hookData)) {
            this.addNickname("@" + nickname);
        }

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    private addNickname(nick) {
        // eslint-disable-next-line unicorn/prefer-query-selector
        const c = document.getElementById("chattext") as HTMLInputElement;
        c.value = [c.value.trim(), nick].join(" ").trim() + " ";
        c.focus()
    }
}
