import { FACTION, FACTION_NAMES } from "../../constants";
import { IITCr } from "../../IITC";
import { dialog } from "../../ui/dialog";
import { Plugin } from "../plugin_base";

interface PortalInfo {
    total: string;
    level8: string;
    levels: string;
    maxLevel: string;
    health: string;
}

export class LocalizedScoreboard extends Plugin {
    public name = "Localized scoreboard";
    public version = "1.0";
    public description = "Display a scoreboard about all visible portals with statistics about both teams,like average portal level,link & field counts etc";
    public author = "Costaspap and harisbitsakou";
    public tags: ["scoreboard", "portals", "count", "info"];
    public defaultInactive = true;


    activate() {
        this.addCSS();
        this.addControl();
    }

    deactivate() {
        this.removeControl();
    }

    private addCSS() {
        $("head style#LocalizedScoreboard").remove();
        $("<style>", { id: "LocalizedScoreboard" }).html(`
    #scoreboard table { margin-top: 5px; border-collapse: collapse; width: 100%; background-color: #1b415e }
    #scoreboard tr { border-bottom: 1px solid #0b314e; color: white; }
    #scoreboard td, #scoreboard th { padding: 3px 10px; text-align: left; }
    #scoreboard col.enl { background-color: #017f01; }
    #scoreboard col.res { background-color: #005684; }
    #scoreboard col.mac { background-color: #7f3333; }
    #scoreboard .disclaimer { margin-top: 10px; color: yellow; }
    #scoreboard.mobile { position: absolute; top: 0; width: 100%; }
    `).appendTo("head");
    }


    private addControl() {
        IITCr.menu.addEntry({ id: "LocalizedScoreboard", name: "View\\Scoreboard", onClick: () => this.displayScoreboard() });
    }

    private removeControl() {
        IITCr.menu.removeEntry("LocalizedScoreboard");
    }


    displayScoreboard() {
        const bounds = window.map.getBounds();
        const portals = this.getPortalsInfo(bounds);

        let html = "";
        if (portals) {
            const linksCount = this.getEntitiesCount(Object.values(window.links), bounds);
            const fieldsCount = this.getEntitiesCount(Object.values(window.fields), bounds);
            html += this.makeTable(portals, linksCount, fieldsCount);
        } else {
            html += "<p>Nothing to show!<p>";
        }

        if (window.map.getZoom() < 15) {
            html += '<p class="disclaimer"><b>Zoom in for a more accurate scoreboard!</b></p>';
        }

        html = '<div id="scoreboard">' + html + "</div>";
        if (window.useAppPanes()) {
            $(html).addClass("mobile").appendTo(document.body);
        } else {
            dialog({
                html: html,
                dialogClass: "ui-dialog-scoreboard",
                title: "Scoreboard",
                id: "Scoreboard"
            });
        }
    }


    private getPortalsInfo(bounds: L.LatLngBounds): PortalInfo[] | undefined {

        const portals = Object.values(window.portals)
            .filter(portal => bounds.contains(portal.getLatLng()));
        if (portals.length === 0) return;

        const score = FACTION_NAMES.map(() => {
            return {
                placeHolders: 0,
                total: 0,
                level8: 0,
                levels: 0,
                maxLevel: 0,
                health: 0
            }
        });

        portals.forEach(portal => {
            const info = portal.options;
            const teamN = info.team;
            const team = score[teamN];

            if (!info.data.title) {
                team.placeHolders++;
                return;
            }
            team.health += info.data.health;
            team.levels += info.level ?? 0;
            if (info.level === 8) { team.level8++; }
            team.maxLevel = Math.max(team.maxLevel, info.level ?? 0);
            team.total++;
        });


        return score.map(team => {
            return <PortalInfo>{
                health: team.total ? (team.health / team.total).toFixed(1) + "%" : "-",
                levels: team.total ? (team.levels / team.total).toFixed(1) : "-",
                level8: team.level8 > 0 ? team.level8.toString() : "-",
                maxLevel: team.maxLevel > 0 ? team.maxLevel.toString() : "-",
                total: team.placeHolders ? `${team.total} + ${team.placeHolders}` : team.total.toString()
            }
        });

    }


    private getEntitiesCount(entities: IITC.Link[] | IITC.Field[], bounds: L.LatLngBounds) {
        const onScreen = entities.filter(ent => ent.getLatLngs().some(p => bounds.contains(p)));
        const counts = FACTION_NAMES.map(() => 0);
        onScreen.forEach(entity => counts[entity.options.team]++);
        return counts;
    }


    makeTable(portals: PortalInfo[], linksCount: number[], fieldsCount: number[]): string {

        let html =
            "<table>" +
            '<colgroup><col><col class="enl"><col class="res"><col class="mac"></colgroup>' +
            "<tr>" +
            "<th>Metrics</th>" +
            '<th class="enl">Enlightened</th>' +
            '<th class="res">Resistance</th>' +
            '<th class="mac">__MACHINA__</th>' +
            "</tr>\n";


        const lines = [
            ["Portals", portals[FACTION.ENL].total, portals[FACTION.RES].total, portals[FACTION.MAC].total],
            ["avg Level", portals[FACTION.ENL].levels, portals[FACTION.RES].levels, portals[FACTION.MAC].levels],
            ["avg Health", portals[FACTION.ENL].health, portals[FACTION.RES].health, portals[FACTION.MAC].health],
            ["Level 8", portals[FACTION.ENL].level8, portals[FACTION.RES].level8, portals[FACTION.MAC].level8],
            ["Max Level", portals[FACTION.ENL].maxLevel, portals[FACTION.RES].maxLevel, portals[FACTION.MAC].maxLevel],
            ["Links", linksCount[FACTION.ENL], linksCount[FACTION.RES], linksCount[FACTION.MAC]],
            ["Fields", fieldsCount[FACTION.ENL], fieldsCount[FACTION.RES], fieldsCount[FACTION.MAC]],
        ];

        html += lines.map(line => {
            const cells = line.map(cell => `<td>${cell}</td>`).join("");
            return `<tr>${cells}</tr>`;
        }).join("");

        html += "</table>";
        return html;
    }
}
