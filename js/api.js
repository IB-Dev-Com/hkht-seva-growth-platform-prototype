/* ============================================================
   AI for Seva — Mock backend / data-access layer (App.api)
   Loads the JSON "database" under /data like a REST backend,
   with simulated latency + request logging. Falls back to the
   in-memory seed generator when fetch is unavailable (file://).
   ============================================================ */
window.App = window.App || {};

App.api = (function () {
  var BASE = 'data/';
  var lastSource = null;       // 'json' | 'seed-fallback'
  var manifestCache = null;

  function log(msg, color) {
    if (window.console && console.info) console.info('%c[mock-api] ' + msg, 'color:' + (color || '#4f46e5') + ';font-weight:600');
  }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // GET one table (simulated endpoint /data/<table>.json)
  function get(table) {
    var t0 = (window.performance && performance.now) ? performance.now() : 0;
    return fetch(BASE + table + '.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + table);
      return r.json().then(function (data) {
        var ms = t0 ? Math.round(performance.now() - t0) : 0;
        var n = Array.isArray(data) ? data.length + ' rows' : 'object';
        log('GET /' + BASE + table + '.json → 200 (' + n + ', ' + ms + 'ms)');
        return data;
      });
    });
  }

  // Load the full state by reading the manifest then every table.
  function loadState() {
    log('connecting to mock backend → ' + BASE + 'manifest.json …');
    return fetch(BASE + 'manifest.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('manifest HTTP ' + r.status); return r.json(); })
      .then(function (man) {
        manifestCache = man;
        log('manifest v' + man.version + ' · ' + man.tables.length + ' tables');
        return Promise.all(man.tables.map(function (t) {
          return get(t.key).then(function (data) { return { key: t.key, data: data }; });
        })).then(function (parts) {
          var state = {};
          parts.forEach(function (p) { state[p.key] = p.data; });
          lastSource = 'json';
          log('hydrated ' + parts.length + ' tables from JSON backend ✓', '#059669');
          return state;
        });
      })
      .catch(function (e) {
        // file:// or missing data → deterministic in-memory generator
        log('backend unavailable (' + e.message + ') — using in-memory seed generator', '#d97706');
        lastSource = 'seed-fallback';
        return App.seed.build();
      });
  }

  return {
    base: BASE,
    loadState: loadState,
    get: get,
    source: function () { return lastSource; },
    manifest: function () { return manifestCache; }
  };
})();
