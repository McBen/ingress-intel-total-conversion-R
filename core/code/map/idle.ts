// IDLE HANDLING /////////////////////////////////////////////////////
import { Log, LogApp } from "../helper/log_apps";
import { MINUTES, SECONDS } from "../helper/times";
const log = Log(LogApp.Idle);

const IDLE_POLL_TIME = 10 * SECONDS;
const MAX_IDLE_TIME = 15 * MINUTES;
const MAX_IDLE_TIME_HIDDEN = 1 * MINUTES;
export type IdleResumeCallback = () => void;


export class Idle {
    private idleTime: number; // in seconds
    private idleTimeLimit: number;
    private onResumeFunctions: IdleResumeCallback[];
    private lastMouseX;
    private lastMouseY;

    constructor() {
        this.idleTime = 0;
        this.idleTimeLimit = MAX_IDLE_TIME;
        this.onResumeFunctions = [];
        this.lastMouseX = -1;
        this.lastMouseY = -1;

        window.setInterval(() => this.idlePoll(), IDLE_POLL_TIME);
        $("body").on("keypress", () => this.reset());
        $("body").on("mousemove", (event: JQuery.MouseMoveEvent) => this.onMouseMove(event));
    }

    private idlePoll = (): void => {
        const wasIdle = this.isIdle();
        this.idleTime += IDLE_POLL_TIME;

        const hidden = document.visibilityState === "hidden";
        if (hidden) {
            // set a small time limit before entering idle mode
            this.idleTimeLimit = MAX_IDLE_TIME_HIDDEN;
        }
        if (!wasIdle && this.isIdle()) {
            log.log("idlePoll: entering idle mode");
        }
    }

    isIdle(): boolean {
        return this.idleTime >= this.idleTimeLimit;
    }


    reset(): void {
        if (this.isIdle()) {
            log.log("idleReset: leaving idle mode");

            this.onResumeFunctions.forEach(f => f());
        }
        this.idleTime = 0;
        this.idleTimeLimit = MAX_IDLE_TIME;
    }

    set(): void {
        const wasIdle = this.isIdle();
        this.idleTimeLimit = 0;

        if (!wasIdle && this.isIdle()) {
            log.log("idleSet: entering idle mode");
        }
    }

    private onMouseMove(event: JQuery.MouseMoveEvent): void {
        // only reset idle on mouse move where the coordinates are actually different.
        // some browsers send the event when not moving!
        const dX = this.lastMouseX - event.clientX;
        const dY = this.lastMouseY - event.clientY;
        const deltaSquared = dX * dX + dY * dY;
        // only treat movements over 3 pixels as enough to reset us
        if (deltaSquared > 3 * 3) {
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            this.reset();
        }
    }

    addResumeFunction(fct: IdleResumeCallback): void {
        this.onResumeFunctions.push(fct);
    }
}

export const idle = new Idle();

