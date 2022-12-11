export class Highlighter {

    readonly name = "No Highlights";

    is(name: string): boolean {
        return name === this.name;
    }

    activate(): void {
        /** overload */
    }

    deactivate(): void {
        /** overload */
    }

    highlight(_portal: IITC.Portal): void {
        /** overload */
    }
}