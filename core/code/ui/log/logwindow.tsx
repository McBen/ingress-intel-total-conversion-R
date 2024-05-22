import { createSignal, For } from "solid-js"

export const LogWindow = () => {
    const [tabs, setTabs] = createSignal(["All", "Faction", "Alert"])
    const [current, setCurrent] = createSignal(tabs()[0]);
    const updateTab = (page) => () => { console.log(page); setCurrent(page) };

    return (
        <>
            <ul class="logtabs">
                <For each={tabs()}>
                    {item => (
                        <li classList={{ selected: current() === item }} onClick={updateTab(item)}>
                            {item}
                        </li>
                    )}
                </For>
            </ul>
            <div class="contents">

            </div>
            {/* <div class="tab" classList={{ pending: pending() }}>
                <Suspense fallback={<div class="loader">Loading...</div>}>
                    <Switch>
                        <Match when={tab() === 0}>
                            <Child page="Uno" />
                        </Match>
                        <Match when={tab() === 1}>
                            <Child page="Dos" />
                        </Match>
                        <Match when={tab() === 2}>
                            <Child page="Tres" />
                        </Match>
                    </Switch>
                </Suspense>
            </div>
                */}
            <input class="sendtext" style="text"></input>
        </>
    );
};

