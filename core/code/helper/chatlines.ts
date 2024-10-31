/* eslint-disable max-len */
/* eslint-disable max-classes-per-file */
import { Log, LogApp } from "./log_apps";
const log = Log(LogApp.Chat);

// TODO: make const again (removed for debug)
export /* const */ enum ChatLineType {
    UNKNOWN = 1, /* a unknown chat line */
    // EVERYTHING, /* all chat lines - special ON hook */
    UPDATE_DONE, /* after chat update */
    CAPTURE,
    FIELD,
    BEACON,
    FIREWORKS,
    BATTLE,
    FRACKER,
    DEPLOY,
    DESTROY_FIELD,
    DESTROY_RESONATOR,
    DESTROY_LINK,
    LINK,
    RECURSE,
    BATTLE_RESULT,
    BATTLE_SCHEDULED,
    ATTACK,
    NEUTRALIZE,
    KINETIC,
    FIRST_CAPTURE,
    FIRST_FIELD,
    FIRST_LINK,
    DRONE_RETURNED,
    CHAT,
    FACTION_CHAT
}

interface Rule {
    id?: number,
    propability: number;
    type: ChatLineType;
    pattern: string[];
}

// DEBUG-START
export // only used in test
    // DEBUG-END
    const ChatRules: Rule[] = [
        { propability: 100, type: ChatLineType.DEPLOY, pattern: ["PLAYER", " deployed a Resonator on ", "PORTAL"] },
        { propability: 70, type: ChatLineType.LINK, pattern: ["FACTION", " agent ", "PLAYER", " linked from ", "PORTAL", " to ", "PORTAL"] },
        { propability: 70, type: ChatLineType.FIELD, pattern: ["FACTION", " agent ", "PLAYER", " created a Control Field @", "PORTAL", " +", "NUMBER", " MUs"] },
        { propability: 70, type: ChatLineType.CAPTURE, pattern: ["PLAYER", " captured ", "PORTAL"] },
        { propability: 60, type: ChatLineType.DESTROY_RESONATOR, pattern: ["PLAYER", " destroyed a Resonator on ", "PORTAL"] },
        { propability: 50, type: ChatLineType.DESTROY_LINK, pattern: ["Agent ", "PLAYER", " destroyed the ", "FACTION", " Link ", "PORTAL", " to ", "PORTAL"] },
        { propability: 1, type: ChatLineType.DESTROY_LINK, pattern: ["PLAYER", " destroyed the Link ", "PORTAL", " to ", "PORTAL"] }, // OLD
        { propability: 1, type: ChatLineType.DESTROY_FIELD, pattern: ["PLAYER", " destroyed a Control Field @", "PORTAL", " -", "NUMBER", " MUs"] }, // OLD
        { propability: 30, type: ChatLineType.DESTROY_FIELD, pattern: ["Agent ", "PLAYER", " destroyed the ", "FACTION", " Control Field @", "PORTAL", " -", "NUMBER", " MUs"] },
        { propability: 10, type: ChatLineType.FIREWORKS, pattern: ["PLAYER", " deployed Fireworks on ", "PORTAL"] },
        { propability: 10, type: ChatLineType.BEACON, pattern: ["PLAYER", " deployed a Beacon on ", "PORTAL"] },
        { propability: 5, type: ChatLineType.NEUTRALIZE, pattern: ["Your Portal ", "PORTAL", " neutralized by ", "PLAYER"] },
        { propability: 5, type: ChatLineType.DESTROY_LINK, pattern: ["Your Link ", "PORTAL", " to ", "PORTAL", " destroyed by ", "PLAYER"] },
        { propability: 5, type: ChatLineType.ATTACK, pattern: ["Your Portal ", "PORTAL", " is under attack by ", "PLAYER"] },
        { propability: 2, type: ChatLineType.KINETIC, pattern: ["Your Kinetic Capsule is now ready."] },
        { propability: 2, type: ChatLineType.FRACKER, pattern: ["PLAYER", " deployed a Portal Fracker on ", "PORTAL"] },
        { propability: 2, type: ChatLineType.BATTLE, pattern: ["PLAYER", " deployed a Very Rare Battle Beacon on ", "PORTAL"] },
        { propability: 2, type: ChatLineType.BATTLE, pattern: ["PLAYER", " deployed a Rare Battle Beacon on ", "PORTAL"] },
        { propability: 2, type: ChatLineType.BATTLE, pattern: ["PLAYER", " deployed a Battle Beacon on ", "PORTAL"] }, // OLD ?
        { propability: 2, type: ChatLineType.BATTLE_SCHEDULED, pattern: ["Rare Battle Beacon", " will be deployed at the end of the Septicycle (", "TEXT", " UTC) on ", "PORTAL"] },
        // SEPTICYCLE = TEXT, plain="2024.05.26 19:00"
        // FIXME { propability: 2, type: ChatLineType.BATTLE_SCHEDULED, pattern: ["Rare Battle Beacon", " will be deployed at the end of the Septicycle (", "SEPTICYCLE", " UTC) on ", "PORTAL"] },
        { propability: 2, type: ChatLineType.BATTLE_RESULT, pattern: ["FACTION", " won a CAT-", "TEXT", " Very Rare Battle Beacon on ", "PORTAL"] },
        { propability: 2, type: ChatLineType.BATTLE_RESULT, pattern: ["FACTION", " won a CAT-", "TEXT", " Rare Battle Beacon on ", "PORTAL"] },
        { propability: 1, type: ChatLineType.BATTLE_RESULT, pattern: ["FACTION", " won a Very Rare Battle Beacon on ", "PORTAL"] }, // OLD ?
        { propability: 1, type: ChatLineType.BATTLE_RESULT, pattern: ["FACTION", " won a Rare Battle Beacon on ", "PORTAL"] }, // OLD ?
        { propability: 1, type: ChatLineType.BATTLE_RESULT, pattern: ["FACTION", " won a Battle Beacon on ", "PORTAL"] }, // dropped ?
        { propability: 1, type: ChatLineType.LINK, pattern: ["PLAYER", " linked ", "PORTAL", " to ", "PORTAL"] }, // OLD
        { propability: 1, type: ChatLineType.FIELD, pattern: ["PLAYER", " created a Control Field @", "PORTAL", " +", "NUMBER", " MUs"] }, // OLD
        { propability: 1, type: ChatLineType.RECURSE, pattern: ["PLAYER", " Recursed"] },
        { propability: 1, type: ChatLineType.FIRST_LINK, pattern: ["SECURE", " ", "PLAYER", " created their first Link."] },
        { propability: 1, type: ChatLineType.FIRST_FIELD, pattern: ["SECURE", " ", "PLAYER", " created their first Control Field"] },
        { propability: 1, type: ChatLineType.FIRST_CAPTURE, pattern: ["SECURE", " ", "PLAYER", " captured their first Portal."] },
        { propability: 1, type: ChatLineType.DRONE_RETURNED, pattern: ["Your Drone returned by ", "PLAYER"] },
        { propability: 1, type: ChatLineType.DRONE_RETURNED, pattern: ["Drone returned to Agent by ", "PLAYER"] },

        { propability: 10, type: ChatLineType.FACTION_CHAT, pattern: ["SECURE", "SENDER", "TEXT" /* empty */, "CHAT"] },
        { propability: 10, type: ChatLineType.CHAT, pattern: ["SENDER", "TEXT" /* empty */, "CHAT"] }
        // CHAT = array of ( AT_PLAYER | TEXT )
    ];

type FilterFunction = (line: Intel.MarkUp) => 0 | 1;
type FilterFunctionRule = (pattern: Rule) => 0 | 1 | undefined;

interface Divider {
    asText: string; // For debug only
    canidates: number[]; // filtered rules by this divider

    expression: string; // the code output
    filterRule: FilterFunctionRule; // divider in tree 

    resultingSizes?: (current: [number, number | undefined]) => [min: number, max: number | undefined];
    requiredSize?: number;
}

export interface DTNode {
    filterText: string; // For debug only
    expression: string;
    switch: FilterFunction;
    childs: [DTNode, DTNode];
}

interface DTLeaf extends DTNode {
    type: ChatLineType;
    verify: FilterFunction[][];
}


const markupType = new Set(["TEXT", "PLAYER", "PORTAL", "FACTION", "NUMBER", "AT_PLAYER", "SENDER", "SECURE", "SEPTICYCLE"]);
const isChatType = (id: string) => id === "TEXT" || id === "AT_PLAYER";
const isChatRule = (rule: Rule, index: number = 99) => index >= rule.pattern.length - 1 && rule.pattern.at(-1) === "CHAT";

export const buildDT = (): DTNode => {
    const dividers = buildDividers(ChatRules);
    const dt = findBestNode(ChatRules, dividers);
    return dt;
}


const buildDividers = (rules: Rule[]): Divider[] => {
    const dividers: Divider[] = [];

    rules.forEach((r, i) => r.id = i);

    const maxParts = rules.reduce((m, rule) => {
        const count = rule.pattern.length;
        return Math.max(m, count);
    }, 3);

    for (let length = 2; length <= maxParts; length++) {
        dividers.push(
            {
                asText: `Message has ${length} parts`,
                expression: `markup.length === ${length}`,
                filterRule: (rule: Rule) => {
                    if (isChatRule(rule, length)) return;
                    return rule.pattern.length === length ? 1 : 0;
                },
                canidates: rules.filter(r => r.pattern.length === length && !isChatRule(r)).map(r => r.id!),

                resultingSizes: () => [length, length]
            },
            {
                asText: `Message has less then ${length} parts`,
                expression: `markup.length < ${length}`,
                filterRule: (rule: Rule) => {
                    if (isChatRule(rule) && rule.pattern.length - 1 < length) return;
                    return rule.pattern.length < length ? 1 : 0;
                },
                canidates: [],
                resultingSizes: current => [current[0], length]
            },
            {
                asText: `Message has more then ${length} parts`,
                expression: `markup.length > ${length}`,
                filterRule: (rule: Rule) => {
                    if (isChatRule(rule) && rule.pattern.length - 1 < length) return;
                    return rule.pattern.length > length ? 1 : 0;
                },
                canidates: [],
                resultingSizes: current => [length, current[1]]
            }
        );
    }

    for (let index = 0; index < maxParts; index++) {
        const parts = rules.map(rule => rule.pattern[index]).filter(f => !!f);
        const unique = new Set(parts);

        let needTextCheck = true;
        unique.forEach(part => {
            if (markupType.has(part)) {
                if (part === "NUMBER") {
                    dividers.push(
                        {
                            asText: `markup[${index}].plain is a nunber`,
                            expression: `!!parseInt(markup[${index}][1].plain)`, // = is number
                            filterRule: (rule: Rule) => {
                                if (isChatType("TEXT") && isChatRule(rule, index)) return;
                                return (rule.pattern[index] === "TEXT" || rule.pattern[index] === "NUMBER") ? 1 : 0;
                            },
                            canidates: rules.filter(r => r.pattern[index] === part).map(r => r.id!),
                            requiredSize: index + 1
                        }
                    );
                } else {
                    dividers.push(
                        {
                            asText: `markup[${index}] is '${part}'`,
                            expression: `markup[${index}][0] === "${part}"`,
                            filterRule: (rule: Rule) => {
                                if (isChatType(part) && isChatRule(rule, index)) return;
                                return rule.pattern[index] === part ? 1 : 0;
                            },
                            canidates: rules.filter(r => r.pattern[index] === part).map(r => r.id!),
                            requiredSize: index + 1
                        }
                    );
                }
            } else if (part === "CHAT") {
                dividers.push(
                    {
                        asText: `markup from ${index} is 'AT_PLAYER' or 'TEXT'`,
                        expression: `markup.every( (m,i) => m[0] === "TEXT" || m[0] === "AT_PLAYER" || i<${index})`,
                        filterRule: (rule: Rule) => rule.pattern.every((m, i) => m === "TEXT" || m === "AT_PLAYER" || m === "CHAT" || i < index) ? 1 : 0,
                        canidates: rules.filter(r => r.pattern[index] === part).map(r => r.id!),
                        requiredSize: index
                    });
            } else {
                if (needTextCheck) {
                    needTextCheck = false;
                    dividers.push(
                        {
                            asText: `markup[${index}] is 'TEXT'`,
                            expression: `markup[${index}][0] === "TEXT"`,
                            filterRule: (rule: Rule) => {
                                if (isChatRule(rule, index)) return;
                                return markupType.has(rule.pattern[index]) ? 0 : 1;
                            },
                            canidates: rules.filter(r => r.pattern[index] === part).map(r => r.id!),
                            requiredSize: index + 1
                        });
                }
                dividers.push(
                    {
                        asText: `markup[${index}].plain is '${part}'`,
                        expression: `markup[${index}][1].plain === "${part}"`,
                        filterRule: (rule: Rule) => {
                            if (isChatRule(rule, index)) return;
                            return rule.pattern[index] === part ? 1 : 0;
                        },
                        canidates: rules.filter(r => r.pattern[index] === part).map(r => r.id!),
                        requiredSize: index + 1
                    }
                );
            }
        })
    }

    return dividers;
}


const expression2Filter = (expression: string): FilterFunction => {
    return eval(`(markup) => (${expression}) ? 1 : 0;`) as FilterFunction;
}


type sizeLimits = [number, number | undefined];
//  route for debug
const findBestNode = (rules: Rule[], dividers: Divider[], sizes: sizeLimits = [1, undefined], route: string[] = []): DTNode => {

    // found a leaf ?
    if (rules.length === 0) return { type: ChatLineType.UNKNOWN, verify: [] } as unknown as DTLeaf;

    const resultType = rules[0].type;
    if (rules.every(r => r.type === resultType)) {

        // find all expressions to validated that this rule matches
        const verifiers = rules.map(rule => {
            return dividers
                .filter(f => f.canidates.includes(rule.id!))
                .map(f => expression2Filter(f.expression))
        });

        return <DTLeaf>{ type: resultType, verify: verifiers };
    }

    // find rule with max information gain
    const [bestDivider] = findBestDivider(rules, dividers, sizes, true, route);

    if (bestDivider < 0) {
        throw new Error("can't find a divider");
    } else {
        // console.log("USE:", dividers[bestDivider].asText);
    }

    // apply filter to rules
    const divider = dividers[bestDivider];
    dividers.splice(bestDivider, 1);
    const parts = splitRules(rules, divider.filterRule);

    let new_sizes = sizes.slice() as sizeLimits;
    if (divider.resultingSizes) new_sizes = divider.resultingSizes(sizes);

    const node: DTNode = {
        filterText: divider.asText,
        switch: expression2Filter(divider.expression),
        expression: divider.expression,
        childs: [
            findBestNode(parts[0], dividers.slice(0), sizes, [...route, "not " + divider.asText]),
            findBestNode(parts[1], dividers.slice(0), new_sizes, [...route, divider.asText]),
        ]
    }

    return node;
}

/**
 * @param route for debug only
 */
const findBestDivider = (rules: Rule[], dividers: Divider[], sizes: sizeLimits, goDeeper: boolean, route: string[]): [index: number, score: number] => {

    const explain_head = false; //goDeeper; 
    if (explain_head) {
        console.log("Route:", route.join("=>"));
        console.log(" sizes:", sizes);
        console.log(" Patterns left");
        rules.forEach(r => console.log(" ->", r.pattern.join(";")));
    }

    const explain = false; // goDeeper; //  "markup[0] is 'SECURE'" === route.at(-1);

    return dividers.reduce((best, divider, index) => {

        // skip rules which requires more size checks
        if (!sizeMatch(divider.requiredSize, sizes)) {
            if (explain) console.log("    skip ->", divider.asText);
            return best;
        }

        let ig = getInformationGain(rules, divider)
        if (explain) console.log("    valid ->", ig, divider.asText);

        if (goDeeper && ig === 0 && divider.resultingSizes) {
            ig = igIfApply(index, rules, dividers, sizes);
            if (explain) console.log("         -> changed to", ig);
        }

        if (ig > best[1]) {
            return [index, ig];
        }
        else return best;
    }, [-1, 0]);
}

/**
 * if a divider won't create a information-gain by it self
 * use this to go a step deeper
 */
const igIfApply = (best: number, rules: Rule[], dividers: Divider[], sizes: sizeLimits): number => {
    if (rules.length === 1) return 0;
    dividers = dividers.slice();
    const [divider] = dividers.splice(best, 1);

    let new_sizes = sizes.slice() as sizeLimits;
    if (divider.resultingSizes) new_sizes = divider.resultingSizes(sizes);

    const parts = splitRules(rules, divider.filterRule);
    const best1 = parts[0].length > 0 ? findBestDivider(parts[0], dividers, sizes, false, [])[1] : 0;
    const best2 = parts[1].length > 0 ? findBestDivider(parts[1], dividers, new_sizes, false, [])[1] : 0;

    // prefer divides with more size limits
    const s1 = (sizes[0] + (sizes[1] || sizes[0])) * 0.000001;
    return (best1 + best2 + s1) * 0.4;
}

const sizeMatch = (requiredSize: number | undefined, sizes: sizeLimits): boolean => {
    if (requiredSize === undefined) return true;

    return requiredSize <= sizes[0] && (!sizes[1] || requiredSize <= sizes[1]);
}


const splitRules = (rules: Rule[], filterRule: FilterFunctionRule): [Rule[], Rule[]] => {
    const parts: [Rule[], Rule[]] = [[], []];
    rules.forEach(rule => {
        const i = filterRule(rule)
        if (i === undefined) {
            parts[0].push(rule);
            parts[1].push(rule);
        } else {
            parts[i].push(rule);
        }
    });

    return parts;
}

const getInformationGain = (rules: Rule[], divider: Divider): number => {
    const { entropy: parentEntropy, total } = getEntropy(rules);

    const parts = splitRules(rules, divider.filterRule);
    if (parts[0].length === 0 || parts[1].length === 0) return 0;
    const { entropy: entropy1, total: total1 } = getEntropy(parts[0]);
    const { entropy: entropy2, total: total2 } = getEntropy(parts[1]);

    const resultEntropy = total1 / total * entropy1 + total2 / total * entropy2;

    // console.debug(divider.asText);
    // console.debug(" 0", parts[0].map(r => r.type).join(","));
    // console.debug(" 1", parts[1].map(r => r.type).join(","));

    return parentEntropy - resultEntropy;
}


const getEntropy = (rules: Rule[]): { entropy: number, total: number } => {

    const counts = new Map<ChatLineType, number>();
    rules.forEach(rule => {
        if (counts.has(rule.type)) {
            counts.set(rule.type, counts.get(rule.type)! + rule.propability);
        } else {
            counts.set(rule.type, 1);
        }
    });

    const elements = [...counts.values()];
    const total = elements.reduce((sum, value) => sum + value, 0);

    const entropy = -1 * elements.reduce((sum, count) => sum + (count / total) * Math.log2(count / total), 0);

    return { entropy, total };
}


export const findType = (dtree: DTNode, chat: Intel.MarkUp): ChatLineType => {
    while (!(dtree as DTLeaf).type) {
        dtree = dtree.childs[dtree.switch(chat)];
    }

    const leaf = dtree as DTLeaf;

    if (leaf.verify.some((v, _i) => {
        return v.every(f => {
            return f(chat);
        });
    })) {
        return leaf.type;
    }

    log.warn("ChatRule doesn't match", chat);
    return ChatLineType.UNKNOWN;
}


const IDENT = "    ";

export const dumpTree = (dtree: DTNode, ident: string = ""): void => {
    if ((dtree as DTLeaf).type) {
        console.log(ident + " = " + ChatLineType[(dtree as DTLeaf).type]);
    } else {
        console.log(ident + dtree.filterText);
        dumpTree(dtree.childs[1], ident + IDENT)
        dumpTree(dtree.childs[0], ident + IDENT)
    }
}


export const dumpAsCode = (dtree: DTNode): void => {
    console.log("export const findTypeCode = (markup: Intel.MarkUp): ChatLineType => {");
    dumpAsCodeNode(dtree, IDENT);
    console.log("};");
}

const dumpAsCodeNode = (dtree: DTNode, ident: string = ""): void => {
    if ((dtree as DTLeaf).type) {
        console.log(`${ident}return ChatLineType.${ChatLineType[(dtree as DTLeaf).type]}; // ${(dtree as DTLeaf).type}`);
    } else {
        console.log(`${ident}if (${dtree.expression}) {`);
        dumpAsCodeNode(dtree.childs[1], ident + IDENT)
        console.log(`${ident}} else {`);
        dumpAsCodeNode(dtree.childs[0], ident + IDENT)
        console.log(`${ident}}`);
    }
}


// generated code
export const findTypeCode = (markup: Intel.MarkUp): ChatLineType => {
    if (markup[0][0] === "TEXT") {
        if (markup.length > 5) {
            if (markup.length > 8) {
                return ChatLineType.DESTROY_FIELD; // 10                                                                                                                                                                 
            } else {
                return ChatLineType.DESTROY_LINK; // 12                                                                                                                                                                  
            }
        } else {
            if (markup.length > 2) {
                if (markup.length === 4) {
                    if (markup[2][1].plain === " neutralized by ") {
                        return ChatLineType.NEUTRALIZE; // 18
                    } else {
                        return ChatLineType.ATTACK; // 17
                    }
                } else {
                    return ChatLineType.BATTLE_SCHEDULED; // 16
                }
            } else {
                if (markup.length === 2) {
                    return ChatLineType.DRONE_RETURNED; // 23
                } else {
                    return ChatLineType.KINETIC; // 19
                }
            }
        }
    } else {
        if (markup[0][0] === "PLAYER") {
            if (markup.length === 3) {
                if (markup[1][1].plain === " deployed a Resonator on ") {
                    return ChatLineType.DEPLOY; // 9
                } else {
                    if (markup[1][1].plain === " captured ") {
                        return ChatLineType.CAPTURE; // 3
                    } else {
                        if (markup[1][1].plain === " destroyed a Resonator on ") {
                            return ChatLineType.DESTROY_RESONATOR; // 11
                        } else {
                            if (markup[1][1].plain === " deployed Fireworks on ") {
                                return ChatLineType.FIREWORKS; // 6
                            } else {
                                if (markup[1][1].plain === " deployed a Beacon on ") {
                                    return ChatLineType.BEACON; // 5
                                } else {
                                    if (markup[1][1].plain === " deployed a Portal Fracker on ") {
                                        return ChatLineType.FRACKER; // 8
                                    } else {
                                        return ChatLineType.BATTLE; // 7
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if (markup.length === 5) {
                    if (markup[1][1].plain === " destroyed the Link ") {
                        return ChatLineType.DESTROY_LINK; // 12
                    } else {
                        return ChatLineType.LINK; // 13
                    }
                } else {
                    if (markup.length === 2) {
                        return ChatLineType.RECURSE; // 14
                    } else {
                        if (markup.length > 2) {
                            if (markup[1][1].plain === " destroyed a Control Field @") {
                                return ChatLineType.DESTROY_FIELD; // 10
                            } else {
                                return ChatLineType.FIELD; // 4
                            }
                        } else {
                            return ChatLineType.UNKNOWN; // 1
                        }
                    }
                }
            }
        } else {
            if (markup[0][0] === "FACTION") {
                if (markup.length > 5) {
                    if (markup.length === 7) {
                        return ChatLineType.LINK; // 13
                    } else {
                        return ChatLineType.FIELD; // 4
                    }
                } else {
                    return ChatLineType.BATTLE_RESULT; // 15
                }
            } else {
                if (markup[0][0] === "SECURE") {
                    if (markup.length > 2) {
                        if (markup[1][0] === "TEXT") {
                            if (markup.length === 4) {
                                if (markup[3][1].plain === " created their first Link.") {
                                    return ChatLineType.FIRST_LINK; // 22
                                } else {
                                    if (markup[3][1].plain === " created their first Control Field") {
                                        return ChatLineType.FIRST_FIELD; // 21
                                    } else {
                                        return ChatLineType.FIRST_CAPTURE; // 20
                                    }
                                }
                            } else {
                                return ChatLineType.UNKNOWN; // 1
                            }
                        } else {
                            return ChatLineType.FACTION_CHAT; // 25
                        }
                    } else {
                        return ChatLineType.UNKNOWN; // 1
                    }
                } else {
                    return ChatLineType.CHAT; // 24
                }
            }
        }
    }
};