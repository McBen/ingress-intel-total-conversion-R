// PORTAL DETAILS DISPLAY ////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return pretty, displayable HTML or parts thereof.

window.getPortalHistoryDetails = function (d) {
  if (!d.history) {
    return '<div id="historydetails" class="missing">History missing</div>';
  }
  var classParts = {};
  ['visited', 'captured', 'scoutControlled'].forEach(function (k) {
    classParts[k] = d.history[k] ? 'class="completed"' : "";
  });

  return L.Util.template('<div id="historydetails">History: '
    + '<span id="visited" {visited}>visited</span> | '
    + '<span id="captured" {captured}>captured</span> | '
    + '<span id="scout-controlled" {scoutControlled}>scout controlled</span>'
    + '</div>', classParts);
}



window.rangeLinkClick = function () {
  if (window.portalRangeIndicator)
    window.map.fitBounds(window.portalRangeIndicator.getBounds());
  if (window.isSmartphone())
    window.show('map');
}


