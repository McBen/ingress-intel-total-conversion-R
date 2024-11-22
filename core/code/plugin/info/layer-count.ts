/* eslint-disable max-classes-per-file */
import { FACTION } from "../../constants";
import { pnpoly } from "../../helper/utils_misc";
import { IITCr } from "../../IITC";
import { Plugin } from "../plugin_base";

interface CalcResult {
    res: number;
    enl: number;
    drawn: number;
}


export class LayerCount extends Plugin {
    public name = "Layer count";
    public version = "1.0";
    public description = "Count nested fields";
    public author = "fkloft";
    public tags: ["fields", "info", "layer"];
    public defaultInactive = true;

    private tooltip: HTMLElement;

    activate() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, unicorn/prefer-module
        require("./layer-count.css");

        this.addControl();
    }

    deactivate() {
        this.removeControl();
    }


    addControl() {
        const button = document.createElement('a');
        button.className = 'leaflet-bar-part';
        button.addEventListener('click', event => {
            const button = event.target! as HTMLElement;
            if (button.classList.contains('active')) {
                window.map.off('click', (event) => this.updateToolTip(event));
                button.classList.remove('active');
            } else {
                window.map.on('click', (event) => this.updateToolTip(event));
                button.classList.add('active');
                setTimeout(() => {
                    this.tooltip.textContent = 'Click on map';
                }, 10);
            }
        }, false);
        button.title = 'Count nested fields';

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'leaflet-control-layer-count-tooltip';
        button.appendChild(this.tooltip);

        const container = document.createElement('div');
        container.className = 'leaflet-control-layer-count leaflet-bar leaflet-control';
        container.appendChild(button);

        $(".leaflet-control-container .leaflet-top.leaflet-left").append(container);
    }

    removeControl() {
        window.map.off('click', this.updateToolTip);
        $(".leaflet-control-container .leaflet-top.leaflet-left .leaflet-control-layer-count").remove();
    }



    private updateToolTip(event: L.LeafletMouseEvent) {
        const counts = this.calculate(event.layerPoint);

        let content;
        if (counts.res !== 0 && counts.enl !== 0) {
            content = `Res: ${counts.res} + Enl: ${counts.enl} = ${counts.res + counts.enl} fields`;
        } else if (counts.res !== 0) {
            content = `Res: ${counts.res} field(s)`;
            // eslint-disable-next-line unicorn/no-negated-condition
        } else if (counts.enl !== 0) {
            content = `Enl: ${counts.enl} field(s)`;
        } else {
            content = 'No fields';
        }
        if (counts.drawn !== 0) {
            content += `; draw: ${counts.drawn} polygon(s)`;
        }

        this.tooltip.innerHTML = content;
    }


    private calculate(point: L.Point): CalcResult {
        const fields = IITCr.fields.getAtPoint(point);

        const result: CalcResult = {
            res: 0,
            enl: 0,
            drawn: 0
        }

        fields.forEach(field => {
            const faction = field.options.team as FACTION;
            if (faction === FACTION.ENL) result.enl++;
            else if (faction === FACTION.RES) result.res++;
        });


        // const drawtools = IITCr.plugins.getPlugin("Draw tools");
        const dt = window.plugin?.drawTools;
        if (dt) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dt.drawnItems.eachLayer((layer: L.Layer) => {
                // @ts-ignore
                if (layer instanceof L.GeodesicPolygon) {
                    // eslint-disable-next-line no-underscore-dangle
                    const positions: L.Point[][] = (<any>layer)._rings;
                    if (pnpoly(positions[0], point)) result.drawn++;
                }
            });
        }

        return result;
    }
}


