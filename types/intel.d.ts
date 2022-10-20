// Data by Niantic INTEL
export type PlayerData = {
    ap: string,
    available_invites: number,
    energy: number,
    min_ap_for_current_level: string,
    min_ap_for_next_level: string,
    nickname: string,
    team: "ENLIGHTENED" | "RESISTANCE",
    verified_level: number,
    xm_capacity: string

    // ONLY IN Passcode-Reedem response!
    guid?: string,
    recursion_count?: string
};


declare global {
    const PLAYER: PlayerData;
}
