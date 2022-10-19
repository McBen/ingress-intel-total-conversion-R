// IDLE HANDLING /////////////////////////////////////////////////////
import anylogger from "anylogger"
const log = anylogger("Idle");

const IDLE_POLL_TIME = 10;
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

        window.setInterval(() => this.idlePoll(), IDLE_POLL_TIME * 1000);
        $("body").on("keypress", () => this.reset());
        $("body").on("mousemove", (event: JQuery.MouseMoveEvent) => this.onMouseMove(event));
    }

    private idlePoll = (): void => {
        const wasIdle = this.isIdle();
        this.idleTime += IDLE_POLL_TIME;

        // TODO: use Document.visibilityState -> https://developer.mozilla.org/en-US/docs/Web/API/Document/hidden
        const hidden = (document.hidden || false);
        if (hidden) {
            this.idleTimeLimit = REFRESH; // set a small time limit before entering idle mode
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

