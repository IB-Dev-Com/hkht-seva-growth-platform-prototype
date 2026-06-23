/* ============================================================
   AI for Seva — Utilities  (global: window.App)
   No build step, no modules — runs from file://
   ============================================================ */
window.App = window.App || {};

App.util = (function () {
  /* ---- tiny DOM builder ----
     el('div.card#x', {onclick, html, ...attrs}, [children])  */
  function el(tag, props, children) {
    var parts = String(tag).split(/(?=[.#])/);
    var node = document.createElement(parts[0] || 'div');
    parts.slice(1).forEach(function (p) {
      if (p[0] === '.') node.classList.add(p.slice(1));
      else if (p[0] === '#') node.id = p.slice(1);
    });
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'class') node.className += ' ' + v;
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function')
          node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    append(node, children);
    return node;
  }
  function append(node, children) {
    if (children == null) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number')
        node.appendChild(document.createTextNode(String(c)));
      else node.appendChild(c);
    });
  }
  function frag(children) { var f = document.createDocumentFragment(); append(f, children); return f; }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---- formatting ---- */
  function inr(n, opts) {
    opts = opts || {};
    if (n == null || isNaN(n)) return '—';
    var abs = Math.abs(n);
    if (opts.compact) {
      if (abs >= 1e7) return '₹' + (n / 1e7).toFixed(opts.dp != null ? opts.dp : 2).replace(/\.00$/, '') + ' Cr';
      if (abs >= 1e5) return '₹' + (n / 1e5).toFixed(opts.dp != null ? opts.dp : 2).replace(/\.00$/, '') + ' L';
      if (abs >= 1e3) return '₹' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return '₹' + Math.round(n).toLocaleString('en-IN');
  }
  function num(n) { return (n == null || isNaN(n)) ? '—' : Math.round(n).toLocaleString('en-IN'); }
  function pct(n, dp) { return (n == null || isNaN(n)) ? '—' : (n).toFixed(dp != null ? dp : 1) + '%'; }
  function initials(name) {
    if (!name) return '?';
    var p = name.trim().split(/\s+/);
    return ((p[0] || '')[0] || '') + (p.length > 1 ? (p[p.length - 1][0] || '') : '');
  }
  // deterministic color from string
  function colorFor(str) {
    var palette = ['#6366f1','#0d9488','#ea580c','#7c3aed','#0891b2','#db2777','#2563eb','#059669','#d97706','#9333ea'];
    var h = 0; str = String(str || '');
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  }

  /* ---- dates (fixed "today" = platform demo date) ---- */
  var TODAY = new Date('2026-06-23T10:30:00');
  function now() { return new Date(TODAY.getTime()); }
  function daysAgo(d) { var x = now(); x.setDate(x.getDate() - d); return x; }
  function hoursFromNow(h) { var x = now(); x.setHours(x.getHours() + h); return x; }
  function fmtDate(d) {
    if (!d) return '—'; d = new Date(d);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(d) {
    if (!d) return '—'; d = new Date(d);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtTime(d){ if(!d) return '—'; d=new Date(d); return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}); }
  function ago(d) {
    if (!d) return '—';
    var s = (now() - new Date(d)) / 1000;
    if (s < 0) { // future
      var f = -s;
      if (f < 3600) return 'in ' + Math.round(f / 60) + 'm';
      if (f < 86400) return 'in ' + Math.round(f / 3600) + 'h';
      return 'in ' + Math.round(f / 86400) + 'd';
    }
    if (s < 60) return 'just now';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    if (s < 2592000) return Math.round(s / 86400) + 'd ago';
    return Math.round(s / 2592000) + 'mo ago';
  }
  function mins(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  /* ---- misc ---- */
  function uid(prefix) { uid._n = (uid._n || 0) + 1; return (prefix || 'ID') + '-' + Date.now().toString(36).slice(-4).toUpperCase() + uid._n; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function group(arr, key) { var m = {}; arr.forEach(function (x) { var k = typeof key === 'function' ? key(x) : x[key]; (m[k] = m[k] || []).push(x); }); return m; }
  function sum(arr, f) { return arr.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); }
  function sortBy(arr, f, dir) { return arr.slice().sort(function (a, b) { var x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * (dir === 'desc' ? -1 : 1); }); }

  return {
    el: el, frag: frag, clear: clear, append: append, $: $, $$: $$,
    inr: inr, num: num, pct: pct, initials: initials, colorFor: colorFor,
    now: now, daysAgo: daysAgo, hoursFromNow: hoursFromNow,
    fmtDate: fmtDate, fmtDateTime: fmtDateTime, fmtTime: fmtTime, ago: ago, mins: mins, TODAY: TODAY,
    uid: uid, clone: clone, debounce: debounce, sleep: sleep, escapeHtml: escapeHtml,
    group: group, sum: sum, sortBy: sortBy
  };
})();
