export class SearchDialog {

    constructor() {
        this.show();
    }

    show(): void {

        $("#searchwrapper").remove();

        const html = $("<div>", { id: "searchwrapper" }).append(
            $("<div>", { id: "searchdecorator" }).append(
                $("<input>", {
                    id: "search",
                    placeholder: "Search location…",
                    type: "search"
                })
            )
        );

        dialog({
            title: "Search",
            html,
            resizable: true,
            id: "theonlysearchdialog" // TODO move search logic here to support multiple dialogs
        })

        window.search.setup();
    }
}