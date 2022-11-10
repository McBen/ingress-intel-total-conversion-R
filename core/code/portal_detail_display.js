import { portalDetail } from "./portal/portal_details_get";
import { getPortalMiscDetails, getResonatorDetails } from "./portal/portal_display_helper"

// PORTAL DETAILS MAIN ///////////////////////////////////////////////
// main code block that renders the portal details in the sidebar and
// methods that highlight the portal in the map view.

window.resetScrollOnNewPortal = function () {
  if (selectedPortal !== window.renderPortalDetails.lastVisible) {
    // another portal selected so scroll position become irrelevant to new portal details
    $("#sidebar").scrollTop(0); // NB: this works ONLY when #sidebar:visible
  }
};

// to be ovewritten in app.js
window.renderPortalUrl = function (lat, lng, title) {
  var linkDetails = $('.linkdetails');

  // a permalink for the portal
  var permaHtml = $('<a>').attr({
    href: window.makePermalink([lat, lng]),
    title: 'Create a URL link to this portal'
  }
  ).text('Portal link');
  linkDetails.append($('<aside>').append(permaHtml));

  // and a map link popup dialog
  var mapHtml = $('<a>').attr({
    title: 'Link to alternative maps (Google, etc)'
  }).text('Map links').click(window.showPortalPosLinks.bind(this, lat, lng, title));
  linkDetails.append($('<aside>').append(mapHtml));
};


window.renderPortalDetails = function (guid) {
  selectPortal(window.portals[guid] ? guid : null);
  if ($('#sidebar').is(':visible')) {
    window.resetScrollOnNewPortal();
    window.renderPortalDetails.lastVisible = guid;
  }

  if (guid && !portalDetail.isFresh(guid)) {
    portalDetail.request(guid);
  }

  // TODO? handle the case where we request data for a particular portal GUID, but it *isn't* in
  // window.portals....

  if (!window.portals[guid]) {
    urlPortal = guid;
    $('#portaldetails').html('');
    if (isSmartphone()) {
      $('.fullimg').remove();
      $('#mobileinfo').html('<div style="text-align: center"><b>tap here for info screen</b></div>');
    }
    return;
  }

  var portal = window.portals[guid];
  var data = portal.options.data;
  var details = portalDetail.get(guid);
  var historyDetails = getPortalHistoryDetails(data);

  // details and data can get out of sync. if we have details, construct a matching 'data'
  if (details) {
    data = details.getPortalSummaryData();
  }


  var modDetails = details ? '<div class="mods">' + getModDetails(details) + '</div>' : '';
  var miscDetails = details ? getPortalMiscDetails(guid, details) : '';
  var resoDetails = details ? getResonatorDetails(details) : '';

  //TODO? other status details...
  var statusDetails = details ? '' : '<div id="portalStatus">Loading details...</div>';

  var img = fixPortalImageUrl(details ? details.image : data.image);
  var title = (details && details.title) || (data && data.title) || 'null';

  var lat = data.latE6 / 1E6;
  var lng = data.lngE6 / 1E6;

  var imgTitle = title + '\n\nClick to show full image.';


  // portal level. start with basic data - then extend with fractional info in tooltip if available
  var levelInt = data.team === TEAM_NONE ? 0 : data.level;
  var levelDetails = levelInt;
  if (details) {
    levelDetails = getPortalLevel(details);
    if (levelDetails != 8) {
      if (levelDetails == Math.ceil(levelDetails))
        levelDetails += "\n8";
      else
        levelDetails += "\n" + (Math.ceil(levelDetails) - levelDetails) * 8;
      levelDetails += " resonator level(s) needed for next portal level";
    } else {
      levelDetails += "\nfully upgraded";
    }
  }
  levelDetails = "Level " + levelDetails;

  $('#portaldetails')
    .html('') //to ensure it's clear
    .attr('class', TEAM_TO_CSS[data.team])
    .append(
      $('<h3>', { class: 'title' })
        .text(title)
        .prepend(
          $('<svg><use xlink:href="#ic_place_24px"/><title>Click to move to portal</title></svg>')
            .attr({
              class: 'material-icons icon-button',
              style: 'float: left'
            })
            .click(function () {
              zoomToAndShowPortal(guid, [data.latE6 / 1E6, data.lngE6 / 1E6]);
              if (isSmartphone()) { show('map') };
            })),

      $('<span>').attr({
        class: 'close',
        title: 'Close [w]',
        accesskey: 'w'
      }).text('X')
        .click(function () {
          renderPortalDetails(null);
          if (isSmartphone()) { show('map') };
        }),

      // help cursor via ".imgpreview img"
      $('<div>')
        .attr({
          class: 'imgpreview',
          title: imgTitle,
          style: 'background-image: url("' + img + '")'
        })
        .append(
          $('<span>', { id: 'level', title: levelDetails })
            .text(levelInt),
          $('<img>', { class: 'hide', src: img })
        ),

      modDetails,
      miscDetails,
      resoDetails,
      statusDetails,
      $('<div>', { class: 'linkdetails' }),
      historyDetails
    );

  window.renderPortalUrl(lat, lng, title, guid);

  // only run the hooks when we have a portalDetails object - most plugins rely on the extended data
  // TODO? another hook to call always, for any plugins that can work with less data?
  if (details) {
    runHooks('portalDetailsUpdated', { guid: guid, portal: portal, portalDetails: details, portalData: data });
  }
}



// draws link-range and hack-range circles around the portal with the
// given details. Clear them if parameter 'd' is null.
window.setPortalIndicators = function (p) {

  if (portalRangeIndicator) map.removeLayer(portalRangeIndicator);
  portalRangeIndicator = null;
  if (portalAccessIndicator) map.removeLayer(portalAccessIndicator);
  portalAccessIndicator = null;

  // if we have a portal...

  if (p) {
    var coord = p.getLatLng();

    // range is only known for sure if we have portal details
    // TODO? render a min range guess until details are loaded..?

    var d = portalDetail.get(p.options.guid);
    if (d) {
      var range = getPortalRange(d);
      portalRangeIndicator = (range.range > 0
        ? L.geodesicCircle(coord, range.range, {
          fill: false,
          color: RANGE_INDICATOR_COLOR,
          weight: 3,
          dashArray: range.isLinkable ? undefined : "10,10",
          interactive: false
        })
        : L.circle(coord, range.range, { fill: false, stroke: false, interactive: false })
      ).addTo(map);
    }

    portalAccessIndicator = L.circle(coord, HACK_RANGE,
      { fill: false, color: ACCESS_INDICATOR_COLOR, weight: 2, interactive: false }
    ).addTo(map);
  }

}

// highlights portal with given GUID. Automatically clears highlights
// on old selection. Returns false if the selected portal changed.
// Returns true if it's still the same portal that just needs an
// update.
window.selectPortal = function (guid) {
  var update = selectedPortal === guid;
  var oldPortalGuid = selectedPortal;
  selectedPortal = guid;

  var oldPortal = portals[oldPortalGuid];
  var newPortal = portals[guid];

  // Restore style of unselected portal
  if (!update && oldPortal) setMarkerStyle(oldPortal, false);

  // Change style of selected portal
  if (newPortal) {
    setMarkerStyle(newPortal, true);

    if (map.hasLayer(newPortal)) {
      newPortal.bringToFront();
    }
  }

  setPortalIndicators(newPortal);

  runHooks('portalSelected', { selectedPortalGuid: guid, unselectedPortalGuid: oldPortalGuid });
  return update;
}
