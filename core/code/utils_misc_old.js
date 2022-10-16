window.zoomToAndShowPortal = function (guid, latlng) {
  map.setView(latlng, DEFAULT_ZOOM);
  // if the data is available, render it immediately. Otherwise defer
  // until it becomes available.
  if (window.portals[guid])
    renderPortalDetails(guid);
  else
    urlPortal = guid;
}

window.selectPortalByLatLng = function (lat, lng) {
  if (lng === undefined && lat instanceof Array) {
    lng = lat[1];
    lat = lat[0];
  } else if (lng === undefined && lat instanceof L.LatLng) {
    lng = lat.lng;
    lat = lat.lat;
  }
  for (var guid in window.portals) {
    var latlng = window.portals[guid].getLatLng();
    if (latlng.lat == lat && latlng.lng == lng) {
      renderPortalDetails(guid);
      return;
    }
  }

  // not currently visible
  urlPortalLL = [lat, lng];
  map.setView(urlPortalLL, DEFAULT_ZOOM);
};


Object.defineProperty(String.prototype, 'capitalize', {
  value: function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  }
});

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#polyfill
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function (search, rawPos) {
      var pos = rawPos > 0 ? rawPos | 0 : 0;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#polyfill
// (required for KitKat support)
if (!Math.trunc) {
  Math.trunc = function (v) {
    return v < 0 ? Math.ceil(v) : Math.floor(v);
  };
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#polyfill
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function (predicate) {
      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
}

// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function (s) {
    var el = this;

    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}


/*
pnpoly Copyright (c) 1970-2003, Wm. Randolph Franklin
 
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:
 
  1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
     disclaimers.
  2. Redistributions in binary form must reproduce the above copyright notice in the documentation and/or other
     materials provided with the distribution.
  3. The name of W. Randolph Franklin may not be used to endorse or promote products derived from this Software without
     specific prior written permission.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
window.pnpoly = function (polygon, point) {
  var inside = 0;
  // j records previous value. Also handles wrapping around.
  for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    inside ^= polygon[i].y > point.y !== polygon[j].y > point.y &&
      point.x - polygon[i].x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y);
  }
  // Let's make js as magical as C. Yay.
  return !!inside;
};



// @function makePermalink(latlng?: LatLng, options?: Object): String
// Makes the permalink for the portal with specified latlng, possibly including current map view.
// Portal latlng can be omitted to create mapview-only permalink.
// @option: includeMapView: Boolean = null
// Use to add zoom level and latlng of current map center.
// @option: fullURL: Boolean = null
// Use to make absolute fully qualified URL (default: relative link).
window.makePermalink = function (latlng, options) {
  options = options || {};

  function round(l) { // ensures that lat,lng are with same precision as in stock intel permalinks
    return Math.floor(l * 1e6) / 1e6;
  }
  var args = [];
  if (!latlng || options.includeMapView) {
    var c = window.map.getCenter();
    args.push(
      "ll=" + [round(c.lat), round(c.lng)].join(","),
      "z=" + window.map.getZoom()
    );
  }
  if (latlng) {
    if ("lat" in latlng) { latlng = [latlng.lat, latlng.lng]; }
    args.push("pll=" + latlng.join(","));
  }
  var url = options.fullURL ? "@url_intel_base@" : "/";
  return url + "?" + args.join("&");
};
