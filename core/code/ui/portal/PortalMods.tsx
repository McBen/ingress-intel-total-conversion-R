import { Component, For, Show, createMemo } from "solid-js";
import { NoPortalMod, PortalMOD } from "../../portal/portal_info";

export const COLORS_MOD = { VERY_RARE: "#b08cff", RARE: "#73a8ff", COMMON: "#8cffbf" };


export const PortalMods: Component<{ mods: PortalMOD[]; }> = p => {
    return <div class="mods">
        <For each={p.mods}>{mod => <PortalMod mod={mod} />}</For>
    </div>;
};


const PortalMod: Component<{ mod: PortalMOD; }> = p => {

    const text = createMemo(() => {

        const tooltip = [];

        let name = p.mod.type || "(unknown mod)";
        if (p.mod.rarity) {
            name = key2Human(p.mod.rarity) + " " + name;
        }
        tooltip.push(name);

        if (p.mod.owner) {
            tooltip.push(`by: ${p.mod.owner}`, "");
        }

        if (p.mod.stats) {
            for (const key in p.mod.stats) {
                if (!Object.prototype.hasOwnProperty.call(p.mod.stats, key)) continue;

                const value = p.mod.stats[key];
                let valueStr = value.toString(); // display unmodified. correct for shield mitigation and multihack


                // special formatting for known mod stats, where the display of the raw value is less useful
                switch (key) {
                    case "HACK_SPEED": { valueStr = `${value / 10000}%`; break; }
                    case "HIT_BONUS": { valueStr = `${value / 10000}%`; break; }
                    case "ATTACK_FREQUENCY": { valueStr = `${value / 1000}x`; break; }
                    case "FORCE_AMPLIFIER": { valueStr = `${value / 1000}x`; break; }
                    case "LINK_RANGE_MULTIPLIER": { valueStr = `${value / 1000}x`; break; }
                    case "LINK_DEFENSE_BOOST": { valueStr = `${value / 1000}x`; break; }
                    case "REMOVAL_STICKINESS": { if (value > 100) valueStr = `${value / 10000}%`; break; } // an educated guess
                }

                tooltip.push(`${valueStr} ${key.capitalize().replace(/_/g, " ")}`);
            }
        }
        return tooltip.join("\n");
    });

    const modClass = createMemo(() => {
        let itemClass = p.mod.type.toLowerCase().replace("(-)", "minus").replace("(+)", "plus").replace(/[^a-z]/g, "_");

        if (p.mod.rarity) {
            itemClass = itemClass + " " + p.mod.rarity.toLowerCase();
        }
        return itemClass;
    });


    return <Show when={p.mod !== NoPortalMod} fallback={<span />}>
        <span
            class={modClass()}
            title={text()}
            style={{
                color: p.mod.rarity ? COLORS_MOD[p.mod.rarity] : "#fff"
            }} />
    </Show>;
};


/**
 * Format string read human able
 */
const key2Human = (key: string): string => {
    return key.capitalize().replace(/_/g, " ");
};
