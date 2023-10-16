/* eslint-disable max-classes-per-file */
import { ChatChannel } from "./chat_channel";

export class ChatChannelAll extends ChatChannel {
    public name = "all";
    public hookMessage = "publicChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        input.css("cssText", "color: #f66 !important");
        mark.css("cssText", "color: #f66 !important");
        mark.text("broadcast:");
    }
}


export class ChatChannelFaction extends ChatChannel {
    public name = "faction";
    public hookMessage = "factionChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        input.css("color", "");
        mark.css("color", "");
        mark.text("tell faction:");
    }
}


export class ChatChannelAlert extends ChatChannel {
    public name = "alert";
    public hookMessage = "alertsChatDataAvailable";

    initInput(mark: JQuery, input: JQuery) {
        mark.css("cssText", "color: #bbb !important");
        input.css("cssText", "color: #bbb !important");
        mark.text("tell Jarvis:");
    }
}

