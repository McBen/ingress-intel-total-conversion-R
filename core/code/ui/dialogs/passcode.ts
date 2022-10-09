interface ResultData {
    other: string[];
    xm: string;
    ap: string;
    inventory: any;
}

export class PasscodeDialog {

    constructor() {
        this.show();
    }

    show(): void {

        const html = $("<div>", { id: "_searchwrapper" }).append(
            $("<div>", { id: "_searchdecorator" }).append(
                $("<input>", {
                    id: "redeem",
                    placeholder: "Redeem code…",
                    type: "text"
                }).
                    on("keypress", event => {
                        if (event.key === "Enter") {
                            this.submitCode($(event.target).val() as string);

                        }
                    })
            ),
            $("<div>", { id: "passcoderesults" })
        );


        dialog({
            title: "Redeem Passcode",
            html,
            resizable: true,
            id: "theonlyredeemdialog"
        })

        $("#passcoderesults").accordion({
            collapsible: true,
            heightStyle: "content"
        })
    }


    submitCode(passcode: string): void {

        passcode = passcode.replace(/[^\u0020-\u007E]+/g, ""); // remove non-printable characters
        if (!passcode) return;

        this.getPasscodeSection(passcode).append("loading");
        $("#dialog-theonlyredeemdialog #redeem").val("");

        window.postAjax(
            "redeemReward", { passcode },
            response => this.showResult(passcode, response),
            response => this.handleError(passcode, response)
        );
    }


    getPasscodeSection(passcode: string): JQuery {

        let section = $("#passcoderesults div#" + passcode);

        if (section.length === 0) {

            section = $("<div>", { id: passcode, class: "result" });
            $("#passcoderesults").prepend($("<h3>", { text: passcode }), section);
        } else {
            section.html("");
        }

        return section;
    }


    handleError(passcode: string, response: JQuery.jqXHR<any>): void {
        let extra = "";
        if (response.status) {
            extra = (window.REDEEM_STATUSES[response.status] || "The server indicated an error.") +
                " (HTTP " + response.status + ")";
        } else {
            extra = "Connection problem.";
        }

        this.logError(passcode, extra);
    }


    logError(passcode: string, errorMessage: string): void {
        this.getPasscodeSection(passcode).append(errorMessage);
    }

    /* data = 
    {
      "rewards": {
        "ap": "0",
        "xm": "1331",
        "other": [],
        "inventory": [
          {
            "name": "Power Cube",
            "awards": [
              {
                "level": 8,
                "count": 10
              }
            ]
          },
          {
            "name": "Media",
            "awards": [
              {
                "level": 1,
                "count": 1
              }
            ]
          }
        ]
      },
      "playerData": {
        "ap": "50740745",
        "energy": 18910,
        "team": "RESISTANCE",
        "available_invites": 282,
        "verified_level": 16,
        "xm_capacity": "22000",
        "min_ap_for_current_level": "40000000",
        "min_ap_for_next_level": "0",
        "guid": "8ef1445e36e4423584251f94dc6db261.c",
        "recursion_count": "1",
        "nickname": "Hevne"
      }
    }*/
    showResult(passcode: string, data: any): void {

        console.debug(data);

        if (data.error) {
            this.logError(passcode, data.error as string);
            return;
        }

        if (!data.rewards) {
            this.logError(passcode, "An unexpected error occured");
            return;
        }

        if (data.playerData) {
            // FIXME PLAYER data
            // window.PLAYER = data.playerData;
            window.setupPlayerStat();
        }


        // FIXME formatPasscodeLong format
        const reward = window.formatPasscodeLong(data.rewards as ResultData) as unknown as string;

        this.getPasscodeSection(passcode).html(reward);
    }

}
