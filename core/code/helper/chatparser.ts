import * as Chat from "./chatlines";
import { EventPublicChatDataAvailable, hooks } from "./hooks";
import { Log, LogApp } from "./log_apps";
const log = Log(LogApp.Chat);

interface ChatHook {
    callbacks: CallBack[],
    callbacksOF: CallBack[],
    done: Set<string>
}

let isActive = false;
const chatHooks: Map<Chat.ChatLineType, ChatHook> = new Map();
// DEBUG-START
let chatTypeDT: Chat.DTNode;
let typeCounts: number[] = [];
// DEBUG-END



export type CallBack = (type: Chat.ChatLineType, line: Intel.ChatLine) => void;

// TODO: merge regular + Single
// TODO: "on" should take a list of events
/**
 * Install Chat-Callback if new chat line is received
 */
export const on = (type: Chat.ChatLineType | Chat.ChatLineType[], callback: CallBack, onetime: boolean = false) => {
    activate();

    type = typeof type === "number" ? [type] : type;
    type.forEach(typ => register(typ, callback, onetime));
}

const register = (type: Chat.ChatLineType, callback: CallBack, onetime: boolean) => {
    let current = chatHooks.get(type);
    if (!current) {
        current = { callbacks: [], callbacksOF: [], done: new Set() };
        chatHooks.set(type, current)
    }

    if (onetime) {
        current.callbacksOF.push(callback);
    } else {
        current.callbacks.push(callback);
    }
}

export const off = (type: Chat.ChatLineType | Chat.ChatLineType[], callback: CallBack, onetime: boolean = false) => {

    type = typeof type === "number" ? [type] : type;
    type.forEach(typ => deregister(typ, callback, onetime));

    if (chatHooks.size === 0) {
        deactivate();
    }
}

const deregister = (type: Chat.ChatLineType, callback: CallBack, onetime: boolean) => {

    let current = chatHooks.get(type);
    if (current) {
        if (onetime) {
            const index = current.callbacksOF.indexOf(callback);
            if (index >= 0) current.callbacksOF.splice(index, 1);
            else log.error("off callback (onetime) not registered");
        } else {
            const index = current.callbacks.indexOf(callback);
            if (index >= 0) current.callbacks.splice(index, 1);
            else log.error("off callback not registered");
        }

        if (current.callbacksOF.length + current.callbacks.length === 0) {
            chatHooks.delete(type);
        }
    }
}


const activate = () => {
    if (isActive) return;

    // DEBUG-START
    chatTypeDT = Chat.buildDT();
    const oldStats = localStorage.getItem("chatstat");
    if (oldStats) typeCounts = JSON.parse(oldStats);
    // DEBUG-END

    hooks.on("publicChatDataAvailable", onPublicChatDataAvailable);
    isActive = true;
}

const deactivate = () => {
    if (!isActive) return;

    hooks.off("publicChatDataAvailable", onPublicChatDataAvailable);

    isActive = false;
}


const onPublicChatDataAvailable = (chat: EventPublicChatDataAvailable) => {

    chat.result.forEach(line => {
        const type =
            // DEBUG-START
            Chat.findType(chatTypeDT, line[2].plext.markup);
        // DEBUG-END
        // RELEASE-START
        Chat.findTypeCode(line[2].plext.markup);
        // RELEASE-END

        // DEBUG-START
        // counting what happens most
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        // DEBUG-END

        // log.debug(Chat.ChatLineType[type], line[2].plext.text);
        const toTrigger = chatHooks.get(type);
        if (toTrigger) {
            toTrigger.callbacks.forEach(trigger => trigger(type, line));

            if (!toTrigger.done.has(line[0])) {
                toTrigger.done.add(line[0]);
                toTrigger.callbacksOF.forEach(trigger => trigger(type, line));

                // TODO: clear "done" list if it gets to large
            }
        }
    })

    const toTrigger = chatHooks.get(Chat.ChatLineType.UPDATE_DONE);
    if (toTrigger) {
        toTrigger.callbacks.forEach(trigger => trigger(Chat.ChatLineType.UPDATE_DONE, [] as any));
    }

    // DEBUG-START
    localStorage.setItem("chatstat", JSON.stringify(typeCounts));
    // DEBUG-END
}


/**
 * Get intel.markup from intel chatline
 */
export const getMarkup = (line: Intel.ChatLine): Intel.MarkUp => {
    const markup = line[2].plext.markup;
    if (!markup) {
        log.error("missing chat-plex markup", line);
        throw new Error("missing chat-plex markup");
    }

    return markup;
}


/**
 * Get a Chat MarkupType from chatline
 */
export const getMarkUpType = <T>(line: Intel.ChatLine, name: "PORTAL" | "PLAYER", index: number = 0): T => {

    const markup = getMarkup(line);
    const entities = markup.filter(m => m[0] === name);
    if (!entities[index]) {
        throw new Error(`no entities (${name} index:${index}) in chat line`);
    }

    return entities[index][1] as T;
}


/**
 * Get a portal from a chatline
 */
export const getPortal = (line: Intel.ChatLine, index: number = 0): Intel.MarkUpPortalType => {
    return getMarkUpType(line, "PORTAL", index);
}

/**
 * Get a agent from a chatline
 */
export const getAgent = (line: Intel.ChatLine): Intel.MarkUpPlayerType => {
    return getMarkUpType(line, "PLAYER");
}

export const getTime = (line: Intel.ChatLine): number => {
    return line[1];
}
