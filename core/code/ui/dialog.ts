import { convertTextToTableMagic } from "../utils_misc";

import { Log, LogApp } from "../helper/log_apps";
const log = Log(LogApp.Dialog);



/* The global ID of onscreen dialogs.
 * Starts at 0.
 */
let DIALOG_ID = 0;

/**
 * All onscreen dialogs, keyed by their ID.
 * (old Mission plugin needs access to DIALOGS)
 */
export const DIALOGS = {};

/* The number of dialogs on screen.
 */
let DIALOG_COUNT = 0;

/* The dialog that has focus.
 */
let DIALOG_FOCUS;

/* Controls how quickly the slide toggle animation
 * should play for dialog collapsing and expanding.
 */
const DIALOG_SLIDE_DURATION = 100;


/**
 * Note: don't use: close,open or focus. these are reserved for iitc dialog useage
 */
export type DialogOptions = Partial<{
    /** If set only one dialog can be open */
    id: string;

    /** Dialog title */
    title: string;

    /**
     * Dialog contents - converted by convertTextToTableMagic
     * \n will be line breaks \t will be table fields
     */
    text: string;

    /** Dialog contents (if no text) */
    html: string | HTMLElement | JQuery;

    dialogClass: string; // = 'ui-dialog-modal'.
    classes: any;

    /**
     * single dialog
     * default: false
    */
    modal: boolean;

    /**
     * moveable dialog
     * default: true
    */
    draggable: boolean;

    /**
     * resizeable dialog
     * default: false
    */
    resizable: boolean;

    /** position, see: https://api.jqueryui.com/position/ */
    position: any;

    /** size */
    height: string | number;
    width: string | number;
    maxHeight: string;
    maxWidth: string;
    minHeight: string;
    minWidth: string;

    autoOpen: boolean;
    closeOnEscape: boolean;
    hide: any;
    appendTo: any;

    /** Specifies the text for the close button */
    closeText: string;

    /** A callback to run on close */
    closeCallback: () => void;
    /** A callback to run on dialog collapse. */
    collapseCallback: () => void;
    /** A callback to run on dialog expansion. */
    expandCallback: () => void;
    /** A callback to run on both collapse and expand (overrides collapseCallback and expandCallback) */
    collapseExpandCallback: (collapsing: boolean) => void;
    /** A callback to run when the dialog gains focus. */
    focusCallback: () => void;
    /** A callback to run when the dialog loses focus. */
    blurCallback: () => void;

    /**
     * Dialog button definition
     */
    buttons: JQueryUI.ButtonOptions[] | { [key: string]: () => void };
}>;



/**
 * Creates a dialog and puts it onscreen.
 */
export const dialog = (options: DialogOptions): JQuery => {
    // Override for smartphones. Preserve default behavior and create a modal dialog.
    options = options || {};

    // Build an identifier for this dialog
    const id = "dialog-" + (options.modal ? "modal" : (options.id ?? `anon-${DIALOG_ID++}`));
    const jqID = "#" + id;
    let html: string | HTMLElement | JQuery = "";

    // Convert text to HTML if necessary
    if (options.text) {
        html = convertTextToTableMagic(options.text);
    } else if (options.html) {
        html = options.html;
    } else {
        console.error("window.dialog: no text in dialog", options);
        html = convertTextToTableMagic("");
    }

    // Modal dialogs should not be draggable
    if (options.modal) {
        options.dialogClass = (options.dialogClass ? options.dialogClass + " " : "") + "ui-dialog-modal";
        options.draggable = false;
    }

    // Close out existing dialogs.
    if (DIALOGS[id]) {
        const selector = $(DIALOGS[id]);
        selector.dialog("close");
        selector.remove();
    }

    // there seems to be a bug where width/height are set to a fixed value after moving a dialog
    const sizeFix = () => {
        if (dialogElement.data("collapsed")) return;

        const diaOpt = dialogElement.dialog("option");
        dialogElement.dialog("option", "height", diaOpt.height);
        dialogElement.dialog("option", "width", diaOpt.width);
    }

    // Create the window, appending a div to the body
    $("body").append('<div id="' + id + '"></div>');
    const dialogOptions = $.extend(true, {
        autoOpen: false,
        modal: false,
        draggable: true,
        closeText: "",
        title: "",
        buttons: {
            "OK": (event: JQuery.MouseEventBase) => {
                const thisDialog = $(event.target).closest(".ui-dialog").find(".ui-dialog-content");
                thisDialog.dialog("close");
            }
        },
        open: function () {
            var titlebar = $(this).closest(".ui-dialog").find(".ui-dialog-titlebar");
            titlebar.find(".ui-dialog-title")
                .addClass("ui-dialog-title-active")
                .addClass("text-overflow-ellipsis");
            var close = titlebar.find(".ui-dialog-titlebar-close");

            // Title should not show up on mouseover
            close.removeAttr("title").addClass("ui-dialog-titlebar-button");

            // re-center dialog on title dblclick
            // jQuery-UI takes care about initial dialog position, but if content's height grows,
            // then dialog's bottom may go beyond screen (e.g. 'Auto draw' with a bunch of bookmarks in folder).
            // So this is just a nasty workaround for such issue.
            // todo: watch height changes and adapt automatically
            titlebar.dblclick(sizeFix);

            if (!$(this).dialog("option", "modal")) {
                // Start out with a cloned version of the close button
                var collapse = close.clone();

                // Change it into a collapse button and set the click handler
                collapse.addClass("ui-dialog-titlebar-button-collapse ui-dialog-titlebar-button-collapse-expanded");
                collapse.click($.proxy(function () {
                    var collapsed = ($(this).data("collapsed") === true);

                    // Toggle collapsed state
                    $(this).data("collapsed", !collapsed);

                    // Run callbacks if we have them
                    if ($(this).data("collapseExpandCallback")) {
                        // @ts-ignore
                        $.proxy($(this).data("collapseExpandCallback"), this)(!collapsed);
                    } else {
                        if (!collapsed && $(this).data("collapseCallback")) {
                            $.proxy($(this).data("collapseCallback"), this)();
                        } else if (collapsed && $(this).data("expandCallback")) {
                            $.proxy($(this).data("expandCallback"), this)();
                        }
                    }

                    // Find the button pane and content dialog in this ui-dialog, and add or remove the 'hidden' class.
                    var dialog = $(this).closest(".ui-dialog");
                    var content = dialog.find(".ui-dialog-content");
                    var buttonpane = dialog.find(".ui-dialog-buttonpane");
                    var button = dialog.find(".ui-dialog-titlebar-button-collapse");

                    // Slide toggle
                    $(this).css("height", "");
                    $(content).slideToggle({
                        duration: DIALOG_SLIDE_DURATION,
                        complete: function () {
                            $(buttonpane).slideToggle({
                                duration: DIALOG_SLIDE_DURATION,
                                complete: sizeFix
                            });
                        }
                    });

                    if (collapsed) {
                        $(button).removeClass("ui-dialog-titlebar-button-collapse-collapsed");
                        $(button).addClass("ui-dialog-titlebar-button-collapse-expanded");
                    } else {
                        $(button).removeClass("ui-dialog-titlebar-button-collapse-expanded");
                        $(button).addClass("ui-dialog-titlebar-button-collapse-collapsed");
                    }
                }, this));

                // Put it into the titlebar
                titlebar.prepend(collapse);
                close.addClass("ui-dialog-titlebar-button-close");
            }

            DIALOGS[$(this).data("id")] = this;
            DIALOG_COUNT++;

            log.log("window.dialog: " + $(this).data("id") + " (" + $(this).dialog("option", "title") + ") opened. " + DIALOG_COUNT + " remain.");
        },
        close: function () {
            // Run the close callback if we have one
            if ($(this).data("closeCallback")) {
                $.proxy($(this).data("closeCallback"), this)();
            }

            // Make sure that we don't keep a dead dialog in focus
            if (DIALOG_FOCUS && $(DIALOG_FOCUS).data("id") === $(this).data("id")) {
                DIALOG_FOCUS = null;
            }

            // Finalize
            delete DIALOGS[$(this).data("id")];

            DIALOG_COUNT--;
            log.log("window.dialog: " + $(this).data("id") + " (" + $(this).dialog("option", "title") + ") closed. " + DIALOG_COUNT + " remain.");

            // remove from DOM and destroy
            $(this).dialog("destroy").remove();
        },
        focus: function () {
            if ($(this).data("focusCallback")) {
                $.proxy($(this).data("focusCallback"), this)();
            }

            // Blur the window currently in focus unless we're gaining focus
            if (DIALOG_FOCUS && $(DIALOG_FOCUS).data("id") !== $(this).data("id")) {
                $.proxy(function () {
                    if ($(this).data("blurCallback")) {
                        $.proxy($(this).data("blurCallback"), this)();
                    }
                    $(this).closest(".ui-dialog").find(".ui-dialog-title").removeClass("ui-dialog-title-active").addClass("ui-dialog-title-inactive");
                }, DIALOG_FOCUS)();
            }

            // This dialog is now in focus
            DIALOG_FOCUS = this;
            $(this).closest(".ui-dialog").find(".ui-dialog-title").removeClass("ui-dialog-title-inactive").addClass("ui-dialog-title-active");
        }
    }, options);


    const dialogElement = $(jqID).dialog(dialogOptions as unknown as JQueryUI.DialogOptions);

    dialogElement.on("dialogdragstop dialogresizestop", sizeFix);

    // Set HTML and IDs
    dialogElement.html(html as string);
    dialogElement.data("id", id);
    dialogElement.data("jqID", jqID);

    // Set callbacks
    dialogElement.data("closeCallback", options.closeCallback);
    dialogElement.data("collapseCallback", options.collapseCallback);
    dialogElement.data("expandCallback", options.expandCallback);
    dialogElement.data("collapseExpandCallback", options.collapseExpandCallback);
    dialogElement.data("focusCallback", options.focusCallback);
    dialogElement.data("blurCallback", options.blurCallback);

    if (options.modal) {
        // ui-modal includes overrides for modal dialogs
        dialogElement.parent().addClass("ui-modal");
    } else {
        // Enable snapping
        dialogElement.dialog().parents(".ui-dialog").draggable("option", "snap", true);
    }

    // Run it
    dialogElement.dialog("open");

    return dialogElement;
}


/**
 * Creates an alert dialog with default settings.
 * If you want more configurability, use window.dialog instead.
 */
export const alert = (text: string | HTMLElement | JQuery, isHTML: boolean, closeCallback: () => void): JQuery => {
    const options: DialogOptions = { closeCallback };
    if (isHTML) {
        options.html = text;
    } else {
        options.text = text as string;
    }

    return dialog(options);
}
