import { createSignal, For } from "solid-js"

export function Tabbar() {
    const [tabs, setTabs] = createSignal(["All", "Faction", "Alert"])


    return (
        <div>
            <For each={tabs()}>
                {(item) => (
                    <a>{item}</a>
                )}
            </For>
        </div>
    )
}