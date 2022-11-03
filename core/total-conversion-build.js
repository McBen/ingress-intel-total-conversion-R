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

// remove complete page. We only wanted the user-data and the page’s
// security context so we can access the API easily. Setup as much as
// possible without requiring scripts.
document.head.innerHTML = ''
  + '<title>Ingress Intel Map</title>'
  + '<link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Roboto:100,100italic,300,300italic,400,400italic,500,500italic,700,700italic&subset=latin,cyrillic-ext,greek-ext,greek,vietnamese,latin-ext,cyrillic"/>';

// remove body element entirely to remove event listeners
document.body = document.createElement('body');
document.body.innerHTML = ''
  + '<div id="map">Loading, please wait</div>'
  + '<div id="chatcontrols" style="display:none">'
  + '<a accesskey="0" title="[0]"><span class="toggle"></span></a>'
  + '<a accesskey="1" title="[1]">all</a>'
  + '<a accesskey="2" title="[2]" class="active">faction</a>'
  + '<a accesskey="3" title="[3]">alerts</a>'
  + '</div>'
  + '<div id="chat" style="display:none">'
  + '  <div id="chatfaction"></div>'
  + '  <div id="chatall"></div>'
  + '  <div id="chatalerts"></div>'
  + '</div>'
  + '<form id="chatinput" style="display:none"><table><tr>'
  + '  <td><time></time></td>'
  + '  <td><mark>tell faction:</mark></td>'
  + '  <td><input id="chattext" type="text" maxlength="256" accesskey="c" title="[c]" /></td>'
  + '</tr></table></form>'
  + '<a id="sidebartoggle" accesskey="i" title="Toggle sidebar [i]"><span class="toggle close"></span></a>'
  + '<div id="scrollwrapper">' // enable scrolling for small screens
  + '  <div id="sidebar" style="display: none">'
  + '    <div id="playerstat">t</div>'
  + '    <div id="gamestat">&nbsp;loading global control stats</div>'
  + '    <div id="portaldetails"></div>'
  + '    <div id="toolbox"></div>'
  + '  </div>'
  + '</div>'
  // avoid error by stock JS
  + '<div id="play_button"></div>'
  + '<div id="header"><div id="nav"></div></div>';

// CONFIG OPTIONS ////////////////////////////////////////////////////
window.REFRESH = 30; // refresh view every 30s (base time)
window.MAX_IDLE_TIME = 15 * 60; // stop updating map after 15min idling
window.HIDDEN_SCROLLBAR_ASSUMED_WIDTH = 20;
window.SIDEBAR_WIDTH = 300;

// how many pixels to the top before requesting new data
window.CHAT_REQUEST_SCROLL_TOP = 200;
window.CHAT_SHRINKED = 60;

window.COLOR_SELECTED_PORTAL = '#f0f';
window.COLORS = ['#FF6600', '#0088FF', '#03DC03']; // none, res, enl
window.COLORS_LVL = ['#000', '#FECE5A', '#FFA630', '#FF7315', '#E40000', '#FD2992', '#EB26CD', '#C124E0', '#9627F4'];
window.COLORS_MOD = { VERY_RARE: '#b08cff', RARE: '#73a8ff', COMMON: '#8cffbf' };

window.MOD_TYPE = { RES_SHIELD: 'Shield', MULTIHACK: 'Multi-hack', FORCE_AMP: 'Force Amp', HEATSINK: 'Heat Sink', TURRET: 'Turret', LINK_AMPLIFIER: 'Link Amp' };

// circles around a selected portal that show from where you can hack
// it and how far the portal reaches (i.e. how far links may be made
// from this portal)
window.ACCESS_INDICATOR_COLOR = 'orange';
window.RANGE_INDICATOR_COLOR = 'red';

// used when zoom level is not specified explicitly (must contain all the portals)
window.DEFAULT_ZOOM = 15;

window.DEFAULT_PORTAL_IMG = '//commondatastorage.googleapis.com/ingress.com/img/default-portal-image.png';

// INGRESS CONSTANTS /////////////////////////////////////////////////
// http://decodeingress.me/2012/11/18/ingress-portal-levels-and-link-range/
window.RESO_NRG = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
window.HACK_RANGE = 40; // in meters, max. distance from portal to be able to access it
window.OCTANTS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
window.OCTANTS_ARROW = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
window.DESTROY_RESONATOR = 75; //AP for destroying portal
window.DESTROY_LINK = 187; //AP for destroying link
window.DESTROY_FIELD = 750; //AP for destroying field
window.CAPTURE_PORTAL = 500; //AP for capturing a portal
window.DEPLOY_RESONATOR = 125; //AP for deploying a resonator
window.COMPLETION_BONUS = 250; //AP for deploying all resonators on portal
window.UPGRADE_ANOTHERS_RESONATOR = 65; //AP for upgrading another's resonator
window.MAX_PORTAL_LEVEL = 8;
window.MAX_RESO_PER_PLAYER = [0, 8, 4, 4, 4, 2, 2, 1, 1];
window.BASE_HACK_COOLDOWN = 300; // 5 mins - 300 seconds
window.HACK_COOLDOWN_FRIENDLY = 3 * 60; // Temp change 1.10.22
window.HACK_COOLDOWN_ENEMY = 5 * 60; // Temp change 1.10.22
window.BASE_HACK_COUNT = 4;

// OTHER MORE-OR-LESS CONSTANTS //////////////////////////////////////
window.TEAM_NONE = 0;
window.TEAM_RES = 1;
window.TEAM_ENL = 2;
window.TEAM_TO_CSS = ['none', 'res', 'enl'];
window.TEAM_NAMES = ['Neutral', 'Resistance', 'Enlightened'];

// STORAGE ///////////////////////////////////////////////////////////
// global variables used for storage. Most likely READ ONLY. Proper
// way would be to encapsulate them in an anonymous function and write
// getters/setters, but if you are careful enough, this works.
window.refreshTimeout = undefined;
window.urlPortal = null;
window.urlPortalLL = null;
window.selectedPortal = null;
window.portalRangeIndicator = null;
window.portalAccessIndicator = null;

// var portalsLayers, linksLayer, fieldsLayer;
global.portalsFactionLayers = undefined;
global.linksFactionLayers = undefined;
global.fieldsFactionLayers = undefined;

// contain references to all entities loaded from the server. If render limits are hit,
// not all may be added to the leaflet layers
window.portals = {};
window.links = {};
window.fields = {};

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
