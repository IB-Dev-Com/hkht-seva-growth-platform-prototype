/* ============================================================
   AI for Seva — Hash router
   Routes map to App.screens[name].render(params)
   ============================================================ */
window.App = window.App || {};
App.screens = App.screens || {};

App.router = (function () {
  var routes = [];          // {pattern:RegExp, keys:[], screen:name}
  var onChange = null;
  var current = null;

  function define(path, screen) {
    var keys = [];
    var pattern = '^' + path.replace(/:[^/]+/g, function (m) { keys.push(m.slice(1)); return '([^/]+)'; }) + '$';
    routes.push({ re: new RegExp(pattern), keys: keys, screen: screen, path: path });
  }

  function parse() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var qIdx = hash.indexOf('?');
    var query = {};
    if (qIdx > -1) {
      hash.slice(qIdx + 1).split('&').forEach(function (kv) { var p = kv.split('='); query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
      hash = hash.slice(0, qIdx);
    }
    for (var i = 0; i < routes.length; i++) {
      var m = hash.match(routes[i].re);
      if (m) {
        var params = {};
        routes[i].keys.forEach(function (k, idx) { params[k] = decodeURIComponent(m[idx + 1]); });
        return { screen: routes[i].screen, params: params, query: query, path: hash };
      }
    }
    return { screen: '404', params: {}, query: query, path: hash };
  }

  function go(path) { location.hash = path; }
  function resolve() { current = parse(); if (onChange) onChange(current); }

  function start(cb) {
    onChange = cb;
    window.addEventListener('hashchange', resolve);
    resolve();
  }
  function getCurrent() { return current; }

  return { define: define, go: go, start: start, getCurrent: getCurrent };
})();
