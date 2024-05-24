import { createSignal, For } from "solid-js"
import { LogRequest } from "./logrequest";



export const [tabs, setTabs] = createSignal<LogRequest[]>([])
export const [lines, setLines] = createSignal<Intel.ChatLine[]>([]);
export const [current, setCurrent] = createSignal(tabs()[0]);

export const LogWindow = () => {
    const updateTab = (page) => () => {
        page.request(false);
        setCurrent(page);
    };

    return (
        <>
            <ul class="logtabs">
                <For each={tabs()}>
                    {item => (
                        <li classList={{ selected: current() === item }} onClick={updateTab(item)}>
                            {item.title}
                        </li>
                    )}
                </For>
            </ul>
            <div class="loglines">
                <div class="contents">
                    <table>
                        <For each={lines()}>
                            {line => (
                                <tr><td>{line[0]}</td></tr>
                            )}
                        </For>
                    </table>
                </div>
                <input class="sendtext" style="text"></input>
            </div>
        </>
    );
};

