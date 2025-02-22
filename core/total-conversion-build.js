if (typeof unsafeWindow !== "undefined") {
  window = unsafeWindow;
  document = window.document;
}

global.$ = $;
global.jQuery = jQuery;
require("jquery-ui/ui/widgets/accordion.js");
require("jquery-ui/ui/widgets/autocomplete.js");
require("jquery-ui/ui/widgets/button.js");
require("jquery-ui/ui/widgets/checkboxradio.js");
require("jquery-ui/ui/widgets/controlgroup.js");
require("jquery-ui/ui/widgets/datepicker.js");
require("jquery-ui/ui/widgets/dialog.js");
require("jquery-ui/ui/widgets/draggable.js");
require("jquery-ui/ui/widgets/droppable.js");
require("jquery-ui/ui/widgets/menu.js");
require("jquery-ui/ui/widgets/mouse.js");
require("jquery-ui/ui/widgets/progressbar.js");
require("jquery-ui/ui/widgets/resizable.js");
require("jquery-ui/ui/widgets/selectable.js");
require("jquery-ui/ui/widgets/selectmenu.js");
require("jquery-ui/ui/widgets/slider.js");
require("jquery-ui/ui/widgets/sortable.js");
require("jquery-ui/ui/widgets/spinner.js");
require("jquery-ui/ui/widgets/tabs.js");
require("jquery-ui/ui/widgets/tooltip.js");

// REPLACE ORIG SITE ///////////////////////////////////////////////////
if (document.documentElement.getAttribute('itemscope') !== null) {
  throw new Error('Ingress Intel Website is down, not a userscript issue.');
}
window.iitcBuildDate = process.env.BUILD_DATE;

// disable vanilla JS
window.onload = function () { };
document.body.onload = function () { };

// originally code here parsed the <Script> tags from the page to find the one that defined the PLAYER object
// however, that's already been executed, so we can just access PLAYER - no messing around needed!

if (!window.PLAYER || !PLAYER.nickname) {
  // page doesn’t have a script tag with player information.
  if (document.getElementById('header_email')) {
    // however, we are logged in.
    // it used to be regularly common to get temporary 'account not enabled' messages from the intel site.
    // however, this is no longer common. more common is users getting account suspended/banned - and this
    // currently shows the 'not enabled' message. so it's safer to not repeatedly reload in this case
    // //setTimeout('location.reload();', 3*1000);
    throw new Error("Logged in but page doesn't have player data");
  }
  // FIXME: handle nia takedown in progress

  // add login form stylesheet
  require("./login.css");

  throw new Error("Couldn't retrieve player data. Are you logged in?");
}

// player information is now available in a hash like this:
// window.PLAYER = {"ap": "123", "energy": 123, "available_invites": 123, "nickname": "somenick", "team": "ENLIGHTENED||RESISTANCE"};

// catch ARK onLoad error
window.addEventListener(
  "error",
  (event) => {
    if (event.error.filename && event.error.filename.includes("ark.js")) event.preventDefault();
  },
  { capture: true, once: true }
);

// remove complete page. We only wanted the user-data and the page’s
// security context so we can access the API easily. Setup as much as
// possible without requiring scripts.
document.head.innerHTML = ''
  + '<title>Ingress Intel Map</title>'
  + '<meta charset="UTF-8">'
  + '<link rel="shortcut icon" href="/img/favicon.ico" />'
  + '<link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Roboto:100,100italic,300,300italic,400,400italic,500,500italic,700,700italic&subset=latin,cyrillic-ext,greek-ext,greek,vietnamese,latin-ext,cyrillic"/>';

// remove body element entirely to remove event listeners
document.body = document.createElement('body');
document.body.innerHTML = ''
  + '<div id="map">Loading, please wait</div>'
  + '<div id="toolbox" style="display: none"></div>'
  + '<div id="scrollwrapper"></div>'
  // avoid error by stock JS
  + '<div id="play_button"></div>'
  + '<div id="header"><div id="nav"></div></div>';

// CONFIG OPTIONS ////////////////////////////////////////////////////
window.COLORS = ['#FF6600', '#0088FF', '#03DC03', "#ff0028"]; // none, res, enl
window.COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];


// used when zoom level is not specified explicitly (must contain all the portals)
window.DEFAULT_ZOOM = 15;

// INGRESS CONSTANTS /////////////////////////////////////////////////
window.MAX_PORTAL_LEVEL = 8;
window.BASE_HACK_COOLDOWN = 300; // 5 mins - 300 seconds

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
window.TEAM_NONE = 0;
window.TEAM_RES = 1;
window.TEAM_ENL = 2;
window.TEAM_MAC = 3;
window.TEAM_TO_CSS = ['none', 'res', 'enl', 'mac'];
window.TEAM_NAMES = ['Neutral', 'Resistance', 'Enlightened', 'Machina'];

// STORAGE ///////////////////////////////////////////////////////////
// global variables used for storage. Most likely READ ONLY. Proper
// way would be to encapsulate them in an anonymous function and write
// getters/setters, but if you are careful enough, this works.
window.refreshTimeout = undefined;
window.selectedPortal = null;
window.portalRangeIndicator = null;
window.portalAccessIndicator = null;

// contain references to all entities loaded from the server. If render limits are hit,
// not all may be added to the leaflet layers
window.portals = {};

// plugin framework. Plugins may load earlier than iitc, so don’t
// overwrite data
if (typeof window.plugin !== 'function') window.plugin = function () { };

require("./code");

var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
  info.script = {
    version: GM_info.script.version,
    name: GM_info.script.name,
    description: GM_info.script.description
  };
} else {
  info.script = {
    version: "",
    name: "",
    description: ""
  };
}
global.script_info = info;
