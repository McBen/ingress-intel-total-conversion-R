import { IITC } from "../IITC";
import { FACTION, FACTION_COLORS, FACTION_NAMES, teamStr2Faction } from "../constants";
import { Player as PLAYER } from "../helper/player";
import { makePermalink } from "../helper/utils_misc";


export const renderMarkup = (markup: Intel.MarkUp[]): string => {
    let message = "";

    transformMessage(markup);

    markup.forEach((ent, ind) => {
        switch (ent[0]) {
            case "SENDER":
            case "SECURE":
                // skip as already handled
                break;

            case "PLAYER": // automatically generated messages
                if (ind > 0) message += renderMarkupEntity(ent); // don’t repeat nick directly
                break;

            default:
                // add other enitities whatever the type
                message += renderMarkupEntity(ent);
                break;
        }
    });
    return message;
}


const transformMessage = (markup: Intel.MarkUp[]) => {
    // "Agent "<player>"" destroyed the "<faction>" Link "
    if (markup.length > 4) {
        if (markup[3][0] === "FACTION" && markup[4][0] === "TEXT" && (markup[4][1].plain === " Link " || markup[4][1].plain === " Control Field @")) {
            (markup[4][1] as any).team = markup[3][1].team;
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


const renderMarkupEntity = (ent: Intel.MarkUp) => {
    switch (ent[0]) {
        case "TEXT":
            return renderText(ent[1]);
        case "PORTAL":
            return renderPortal(ent[1]);
        case "FACTION":
            return renderFactionEnt(ent[1]);
        case "SENDER":
            return renderPlayer(ent[1], false, true);
        case "PLAYER":
            return renderPlayer(ent[1]);
        case "AT_PLAYER":
            return renderPlayer(ent[1], true);
    }

    return $("<div>").text(ent[0] + ":<" + (<any>ent)[1].plain + ">").html();
}


const renderText = (text: Intel.MarkUpTextType) => {
    if ((text as any).team) {
        let teamId = teamStr2Faction((text as any).team as Intel.TeamStr);
        if (teamId === FACTION.none) teamId = FACTION.MAC;
        const spanClass = FACTION_COLORS[teamId];
        return $("<div>")
            .append($("<span>", { class: spanClass, text: text.plain }))
            .html();
    }

    return $("<div>").text(text.plain).html().autoLink();
}


const renderPortal = (portal: Intel.MarkUpPortalType) => {
    const lat = portal.latE6 / 1e6;
    const lng = portal.lngE6 / 1e6;
    const perma = makePermalink(L.latLng(lat, lng));
    const js = "window.selectPortalByLatLng(" + lat + ", " + lng + ");return false";
    return '<a onclick="' + js + '"'
        + ' title="' + portal.address + '"'
        + ' href="' + perma + '" class="help">'
        + portal.name
        + "</a>";
}

const renderFactionEnt = (faction: Intel.MarkUpFactionType) => {
    const teamId = teamStr2Faction(faction.team);
    const name = FACTION_NAMES[teamId];
    const spanClass = FACTION_COLORS[teamId];
    return $("<div>").append($("<span>", { class: spanClass, text: name })).html();
}

const renderPlayer = (player: Intel.MarkUpPlayerType, at: boolean = false, sender: boolean = false) => {
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
            click: (event: JQuery.ClickEvent) => IITC.chat.nicknameClicked(event, name),
            text: (at ? "@" : "") + name
        })).html();
}



