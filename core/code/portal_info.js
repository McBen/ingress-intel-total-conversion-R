// PORTAL DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of a portal, and they
// will return useful, but raw data.







//This function will return the potential level a player can upgrade it to
window.potentialPortalLevel = function (d) {
  var current_level = getPortalLevel(d);
  var potential_level = current_level;

  if (PLAYER.team === d.team) {
    var resonators_on_portal = d.resonators;
    var resonator_levels = new Array();
    // figure out how many of each of these resonators can be placed by the player
    var player_resontators = new Array();
    for (var i = 1; i <= MAX_PORTAL_LEVEL; i++) {
      player_resontators[i] = i > PLAYER.level ? 0 : MAX_RESO_PER_PLAYER[i];
    }
    $.each(resonators_on_portal, function (ind, reso) {
      if (reso !== null && reso.owner === window.PLAYER.nickname) {
        player_resontators[reso.level]--;
      }
      resonator_levels.push(reso === null ? 0 : reso.level);
    });

    resonator_levels.sort(function (a, b) {
      return (a - b);
    });

    // Max out portal
    var install_index = 0;
    for (var i = MAX_PORTAL_LEVEL; i >= 1; i--) {
      for (var install = player_resontators[i]; install > 0; install--) {
        if (resonator_levels[install_index] < i) {
          resonator_levels[install_index] = i;
          install_index++;
        }
      }
    }
    //log.log(resonator_levels);
    potential_level = resonator_levels.reduce(function (a, b) { return a + b; }) / 8;
  }
  return (potential_level);
}


window.fixPortalImageUrl = function (url) {
  if (url) {
    if (window.location.protocol === 'https:') {
      url = url.replace(/^http:\/\//, '//');
    }
    return url;
  } else {
    return DEFAULT_PORTAL_IMG;
  }

}

