import { FACTION, FACTION_COLORS } from "../../../constants";
import { CP_COUNT, RegionScore } from "./region_score";

export class HistoryChart {

    private regionScore: RegionScore;
    private scaleFct: (y: number) => number;
    private logscale: boolean;
    private svgTickText: string[];

    create(regionScore: RegionScore, logscale: boolean): string {
        this.regionScore = regionScore;

        let max = regionScore.getScoreMax(10); // NOTE: ensure a min of 10 for the graph
        max *= 1.09;      // scale up maximum a little, so graph isn't squashed right against upper edge
        this.setScaleType(max, logscale);

        this.svgTickText = [];

        // svg area 400x130. graph area 350x100, offset to 40,10
        const svg = '<div><svg width="400" height="133" style="margin-left: 10px;">' +
            this.svgBackground() +
            this.svgAxis(max) +
            this.svgAveragePath() +
            this.svgFactionPath() +
            this.svgCheckPointMarkers() +
            this.svgTickText.join("") +
            '<foreignObject height="18" width="60" y="113" x="0" class="node"><label title="Logarithmic scale">' +
            '<input type="checkbox" class="logscale"' + (logscale ? " checked" : "") + "/>" +
            "log</label></foreignObject>" +
            "</svg></div>";

        return svg;
    }

    private svgFactionPath(): string {

        let svgPath = "";

        for (let t = 0; t < 2; t++) {

            const col = this.getFactionColor(t);
            const teamPaths = [];

            for (let cp = 1; cp <= this.regionScore.getLastCP(); cp++) {

                const score = this.regionScore.getCPScore(cp);
                if (score !== undefined) {
                    const x = cp * 10 + 40;
                    const y = this.scaleFct(score[t]);
                    teamPaths.push(`${x},${y}`);
                }
            }

            if (teamPaths.length > 0) {
                svgPath += '<polyline points="' + teamPaths.join(" ") + '" stroke="' + col + '" fill="none" />';
            }
        }

        return svgPath;
    }

    private svgCheckPointMarkers(): string {

        let markers = "";

        const col1 = this.getFactionColor(0);
        const col2 = this.getFactionColor(1);

        for (var cp = 1; cp <= CP_COUNT; cp++) {
            var scores = this.regionScore.getCPScore(cp);

            markers +=
                '<g title="dummy" class="checkpoint" data-cp="' + cp + '">' +
                '<rect x="' + (cp * 10 + 35) + '" y="10" width="10" height="100" fill="black" fill-opacity="0" />';

            if (scores) {
                markers +=
                    '<circle cx="' + (cp * 10 + 40) + '" cy="' + this.scaleFct(scores[0]) + '" r="3" stroke-width="1" stroke="' + col1 + '" fill="' + col1 + '" fill-opacity="0.5" />' +
                    '<circle cx="' + (cp * 10 + 40) + '" cy="' + this.scaleFct(scores[1]) + '" r="3" stroke-width="1" stroke="' + col2 + '" fill="' + col2 + '" fill-opacity="0.5" />';
            }

            markers += "</g>";
        }

        return markers;
    }

    private svgBackground(): string {
        return '<rect x="0" y="1" width="400" height="132" stroke="#FFCE00" fill="#08304E" />';
    }

    private svgAxis(max: number): string {
        return '<path d="M40,110 L40,10 M40,110 L390,110" stroke="#fff" />' + this.createTicks(max);
    }

    private createTicks(max: number): string {
        const ticks = this.createTicksHorz();

        const addVTick = (i: number, y: number): void => {
            ticks.push(`M40,${y} L390,${y}`);
            const style = 'font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="end" fill="#fff"';
            this.svgTickText.push(`<text x="35" y="${y}" ${style}>${this.formatNumber(i)}</text>`);
        }

        // vertical
        // first we calculate the power of 10 that is smaller than the max limit
        let vtickStep = Math.pow(10, Math.floor(Math.log10(max)));
        if (this.logscale) {
            for (let i = 0; i < 4; i++) {

                addVTick(vtickStep, this.scaleFct(vtickStep));
                vtickStep /= 10;
            }
        } else {
            // this could be between 1 and 10 grid lines - so we adjust to give nicer spacings
            if (vtickStep < (max / 5)) {
                vtickStep *= 2;
            } else if (vtickStep > (max / 2)) {
                vtickStep /= 2;
            }

            for (let ti = vtickStep; ti <= max; ti += vtickStep) {
                addVTick(ti, this.scaleFct(ti));
            }
        }

        return ('<path d="' + ticks.join(" ") + '" stroke="#fff" opacity="0.3" />');
    }

    private createTicksHorz(): string[] {
        const ticks = [];
        for (let i = 5; i <= 35; i += 5) {
            const x = i * 10 + 40;
            ticks.push(`M${x},10 L${x},110`);
            this.svgTickText.push(`<text x="${x}" y="125" font-size="12" font-family="Roboto, Helvetica, sans-serif" text-anchor="middle" fill="#fff">${i}</text>`);
        }

        return ticks;
    }

    private svgAveragePath(): string {
        let path = "";
        for (let faction = 1; faction < 3; faction++) {
            const col = FACTION_COLORS[faction];

            const points = [];
            for (let cp = 1; cp <= CP_COUNT; cp++) {
                const score = this.regionScore.getAvgScoreAtCP(faction, cp);

                const x = cp * 10 + 40;
                const y = this.scaleFct(score);
                points.push(`${x},${y}`);
            }

            path += '<polyline points="' + points.join(" ") + '" stroke="' + col + '" stroke-dasharray="3,2" opacity="0.8" fill="none"/>';
        }

        return path;
    }

    private setScaleType(max: number, useLogScale: boolean): void {

        this.logscale = useLogScale;
        if (useLogScale) {
            // 0 cannot be displayed on a log scale, so we set the minimum to 0.001 and divide by lg(0.001)=-3
            this.scaleFct = y => Math.round(10 - Math.log10(Math.max(0.001, y / max)) / 3 * 100);
        } else {
            this.scaleFct = y => Math.round(110 - y / max * 100);
        }
    }

    private getFactionColor(t: number) {
        return (t === 0 ? FACTION_COLORS[FACTION.ENL] : FACTION_COLORS[FACTION.RES]);
    }

    private formatNumber(num: number): string {
        return (num >= 1000000000 ? `${num / 1000000000}B` :
            num >= 1000000 ? `${num / 1000000}M` :
                num >= 1000 ? `${num / 1000}k` :
                    num.toString());
    }
}