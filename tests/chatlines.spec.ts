import * as ChatLine from "../core/code/helper/chatlines";
import intelChatData from "./data/chat.json";

import { Log, LogApp } from "../core/code/helper/log_apps";
const log = Log(LogApp.Chat);


type IntelChatResult = { result: Intel.ChatLine[] };
const getIntelChat = (id: string): Intel.ChatLine => {
    const chatData = intelChatData as IntelChatResult;
    const line = chatData.result.find(c => c[0] === id);
    if (!line) throw new Error("test chat line not in asset - check 'data/chat.json'");
    return line;
}


describe("chatline", () => {
    beforeEach(() => { // disable jest console processing
        global.console = require('console');
    });

    it.only("should build the DecisionTree", () => {
        const dt = ChatLine.buildDT();
        ChatLine.dumpAsCode(dt);
        // ChatLine.dumpTree(dt);
        expect(typeof dt).toBe("object");
    })

    it("should recognize a Deploy message", () => {
        const dt = ChatLine.buildDT();
        const deploy = getIntelChat("deployed");
        expect(ChatLine.findType(dt, deploy[2].plext.markup)).toBe(ChatLine.ChatLineType.DEPLOY);
    })


    it("should recognize multiple example lines", () => {
        const dt = ChatLine.buildDT();

        const examples: Record<string, ChatLine.ChatLineType> =
        {
            "field destroyed": ChatLine.ChatLineType.DESTROY_FIELD,
            "link destroyed": ChatLine.ChatLineType.DESTROY_LINK,
            "link created": ChatLine.ChatLineType.LINK,
            "machina linked": ChatLine.ChatLineType.LINK,
            "deployed": ChatLine.ChatLineType.DEPLOY,
            "field created": ChatLine.ChatLineType.FIELD,
            "capture": ChatLine.ChatLineType.CAPTURE,
            "destroyed": ChatLine.ChatLineType.DESTROY_RESONATOR,
        };

        for (const id in examples) {
            const line = getIntelChat(id);
            expect(ChatLine.findType(dt, line[2].plext.markup)).toBe(examples[id]);

            expect(ChatLine.findTypeCode(line[2].plext.markup)).toBe(examples[id]);
        };
    })

    it("should recognize a chat messages", () => {
        const dt = ChatLine.buildDT();
        const chat1 = getIntelChat("chat");
        expect(ChatLine.findType(dt, chat1[2].plext.markup)).toBe(ChatLine.ChatLineType.CHAT);
    })


    it("should recognize a Unknown message", () => {
        // we expect a log warning
        const consoleWarnMock = jest.spyOn(log, 'warn').mockImplementation();

        const dt = ChatLine.buildDT();
        const unknown = getIntelChat("unknown");
        expect(ChatLine.findType(dt, unknown[2].plext.markup)).toBe(ChatLine.ChatLineType.UNKNOWN);

        expect(log.warn).toHaveBeenCalledTimes(1);
        consoleWarnMock.mockRestore();
    })

    it("should not fail on 'kinetic'", () => {
        const dt = ChatLine.buildDT();
        const unknown = getIntelChat("kinetic");
        expect(ChatLine.findType(dt, unknown[2].plext.markup)).toBe(ChatLine.ChatLineType.KINETIC);
    })

    /*
    it("should get portal", () => {
        const deploy = getIntelChat("deployed");
        const portal = Chat.getPortal(deploy);
        expect(portal.name, "First Portal");
    })
    */
})
