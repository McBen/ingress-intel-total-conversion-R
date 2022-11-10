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


// given portal details, returns html code to display mod details.
window.getModDetails = function (d) {
  var mods = [];
  var modsTitle = [];
  var modsColor = [];
  $.each(d.mods, function (ind, mod) {
    var modName = '';
    var modTooltip = '';
    var modColor = '#000';

    if (mod) {
      // all mods seem to follow the same pattern for the data structure
      // but let's try and make this robust enough to handle possible future differences

      modName = mod.name || '(unknown mod)';

      if (mod.rarity) {
        modName = mod.rarity.capitalize().replace(/_/g, ' ') + ' ' + modName;
      }

      modTooltip = modName + '\n';
      if (mod.owner) {
        modTooltip += 'Installed by: ' + mod.owner + '\n';
      }

      if (mod.stats) {
        modTooltip += 'Stats:';
        for (var key in mod.stats) {
          if (!mod.stats.hasOwnProperty(key)) continue;
          var val = mod.stats[key];

          // if (key === 'REMOVAL_STICKINESS' && val == 0) continue;  // stat on all mods recently - unknown meaning, not displayed in stock client

          // special formatting for known mod stats, where the display of the raw value is less useful
          if (key === 'HACK_SPEED') val = (val / 10000) + '%'; // 500000 = 50%
          else if (key === 'HIT_BONUS') val = (val / 10000) + '%'; // 300000 = 30%
          else if (key === 'ATTACK_FREQUENCY') val = (val / 1000) + 'x'; // 2000 = 2x
          else if (key === 'FORCE_AMPLIFIER') val = (val / 1000) + 'x'; // 2000 = 2x
          else if (key === 'LINK_RANGE_MULTIPLIER') val = (val / 1000) + 'x'; // 2000 = 2x
          else if (key === 'LINK_DEFENSE_BOOST') val = (val / 1000) + 'x'; // 1500 = 1.5x
          else if (key === 'REMOVAL_STICKINESS' && val > 100) val = (val / 10000) + '%'; // an educated guess
          // else display unmodified. correct for shield mitigation and multihack - unknown for future/other mods

          modTooltip += '\n+' + val + ' ' + key.capitalize().replace(/_/g, ' ');
        }
      }

      if (mod.rarity) {
        modColor = COLORS_MOD[mod.rarity];
      } else {
        modColor = '#fff';
      }
    }

    mods.push(modName);
    modsTitle.push(modTooltip);
    modsColor.push(modColor);
  });


  var t = '';
  for (var i = 0; i < mods.length; i++) {
    t += '<span' + (modsTitle[i].length ? ' title="' + modsTitle[i] + '"' : '') + ' style="color:' + modsColor[i] + '">' + mods[i] + '</span>'
  }
  // and add blank entries if we have less than 4 mods (as the server no longer returns all mod slots, but just the filled ones)
  for (var i = mods.length; i < 4; i++) {
    t += '<span style="color:#000"></span>'
  }

  return t;
}
