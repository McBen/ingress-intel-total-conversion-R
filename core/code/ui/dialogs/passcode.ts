import { PlayerData } from "../../../../types/intel";
import { COLORS_LVL } from "../../constants";
import { postAjax } from "../../helper/send_request";
import { escapeHtmlSpecialChars } from "../../helper/utils_misc";
import { dialog } from "../dialog";


interface ResultData {
    rewards: Rewards;
    playerData: PlayerData;
    error?: string;
}

interface Rewards {
    other: string[];
    xm: string;
    ap: string;
    inventory: RewardItem[];
}

interface RewardItem {
    name: string;
    awards: {
        level: number,
        count: number
    }[]
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

        postAjax(
            "redeemReward", { passcode },
            response => this.showResult(passcode, response as ResultData),
            response => this.handleError(passcode, response as JQuery.jqXHR<any>)
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
        const StatusText: { [index: number]: string } = {
            429: "You have been rate-limited by the server. Wait a bit and try again.",
            500: "Internal server error"
        };


        let extra = "";
        if (response.status) {
            const errorText = StatusText[response.status] || "The server indicated an error.";
            extra = errorText + " (HTTP " + response.status.toString() + ")";
        } else {
            extra = "Connection problem.";
        }

        this.logError(passcode, extra);
    }


    logError(passcode: string, errorMessage: string): void {
        this.getPasscodeSection(passcode).append(errorMessage);
    }


    showResult(passcode: string, data: ResultData): void {

        if (data.error) {
            this.logError(passcode, data.error);
            return;
        }

        if (!data.rewards) {
            this.logError(passcode, "An unexpected error occured");
            return;
        }

        if (data.playerData) {
            // @ts-ignore
            PLAYER = data.playerData;
        }


        const reward = this.formatPasscodeLong(data.rewards);

        this.getPasscodeSection(passcode).html(reward);
    }


    formatPasscodeLong(data: Rewards): string {
        let html = '<p><strong>Passcode confirmed. Acquired items:</strong></p><ul class="redeemReward">';

        if (data.other) {
            data.other.forEach(item => {
                html += "<li>" + escapeHtmlSpecialChars(item) + "</li>";
            });
        }

        if (parseInt(data.xm) > 0) {
            html += "<li>" + escapeHtmlSpecialChars(data.xm) + " XM</li>";
        }
        if (parseInt(data.ap) > 0) {
            html += "<li>" + escapeHtmlSpecialChars(data.ap) + " AP</li>";
        }

        if (data.inventory) {
            data.inventory.forEach(type => {
                type.awards.forEach(item => {
                    html += `<li>${item.count}x `;

                    const l = item.level;
                    if (l > 0) {
                        html += `<span class="itemlevel" style="color:${COLORS_LVL[l]}">L${l}</span> `;
                    }

                    html += escapeHtmlSpecialChars(type.name) + "</li>";
                });
            });
        }

        html += "</ul>"
        return html;
    }

    /*
    window.formatPasscodeShort = function(data) {
    
      if(data.other) {
        var awards = data.other.map(window.escapeHtmlSpecialChars);
      } else {
        var awards = [];
      }
    
      if(0 < data.xm)
        awards.push(window.escapeHtmlSpecialChars(data.xm) + ' XM');
      if(0 < data.ap)
        awards.push(window.escapeHtmlSpecialChars(data.ap) + ' AP');
    
      if(data.inventory) {
        data.inventory.forEach(function(type) {
          type.awards.forEach(function(item) {
            var str = "";
            if(item.count > 1)
              str += item.count + "&nbsp;";
    
            if(window.REDEEM_SHORT_NAMES[type.name.toLowerCase()]) {
              var shortName = window.REDEEM_SHORT_NAMES[type.name.toLowerCase()];
    
              var l = item.level;
              if(0 < l) {
                l = parseInt(l);
                str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">' + shortName + l + '</span>';
              } else {
                str += shortName;
              }
            } else { // no short name known
              var l = item.level;
              if(0 < l) {
                l = parseInt(l);
                str += '<span class="itemlevel" style="color:' + COLORS_LVL[l] + '">L' + l + '</span> ';
              }
              str += type.name;
            }
    
            awards.push(str);
          });
        });
      }
    
      return '<p class="redeemReward">' + awards.join(', ') + '</p>'
    }    
    */
}
