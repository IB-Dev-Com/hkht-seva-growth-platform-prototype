/* ============================================================
   AI for Seva — Reusable UI components (App.ui)
   ============================================================ */
window.App = window.App || {};

App.ui = (function () {
  var U = App.util, el = U.el;

  /* ---------- Toast ---------- */
  function toast(opts) {
    if (typeof opts === 'string') opts = { msg: opts };
    var kind = opts.kind || 'info';
    var icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
    var node = el('div.toast.' + kind, {}, [
      el('div.t-ico', { text: icons[kind] || 'ℹ' }),
      el('div', {}, [
        opts.title ? el('b', { text: opts.title }) : null,
        el('span', { text: opts.msg || '' })
      ])
    ]);
    var region = U.$('#toast-region');
    region.appendChild(node);
    setTimeout(function () { node.style.transition = 'opacity .3s,transform .3s'; node.style.opacity = '0'; node.style.transform = 'translateX(20px)'; setTimeout(function () { node.remove(); }, 300); }, opts.duration || 3200);
  }

  /* ---------- Modal ---------- */
  function modal(opts) {
    var region = U.$('#modal-region');
    U.clear(region);
    var body = typeof opts.body === 'function' ? opts.body() : opts.body;
    var footEls = (opts.actions || []).map(function (a) {
      return el('button.btn' + (a.variant ? '.btn-' + a.variant : ''), {
        onclick: function () { if (a.onClick) { var r = a.onClick(); if (r !== false) close(); } else close(); }
      }, [a.icon ? el('span.ico', { text: a.icon }) : null, a.label]);
    });
    var modalNode = el('div.modal' + (opts.size ? '.' + opts.size : ''), {}, [
      el('div.modal-head', {}, [
        el('div', {}, [el('h3', { text: opts.title }), opts.subtitle ? el('div.sub', { text: opts.subtitle }) : null]),
        el('button.x', { onclick: close, 'aria-label': 'Close' }, '✕')
      ]),
      el('div.modal-body', {}, body),
      footEls.length ? el('div.modal-foot', {}, footEls) : null
    ]);
    var scrim = el('div.modal-scrim', { onclick: function () { if (opts.dismissable !== false) close(); } });
    region.appendChild(scrim); region.appendChild(modalNode);
    region.classList.add('show'); region.setAttribute('aria-hidden', 'false');
    function close() { region.classList.remove('show'); region.setAttribute('aria-hidden', 'true'); U.clear(region); if (opts.onClose) opts.onClose(); }
    return { close: close, node: modalNode };
  }

  /* ---------- Drawer ---------- */
  function drawer(opts) {
    var region = U.$('#drawer-region');
    U.clear(region);
    var body = typeof opts.body === 'function' ? opts.body() : opts.body;
    var node = el('div.drawer' + (opts.wide ? '.wide' : ''), {}, [
      el('div.drawer-head', {}, [
        el('div', { style: { minWidth: 0 } }, [
          el('h3', { text: opts.title }),
          opts.subtitle ? el('div.sub.t-mut.t-sm.mt-4', { text: opts.subtitle }) : null
        ]),
        el('button.x', { onclick: close, 'aria-label': 'Close', style: { marginLeft: 'auto' } }, '✕')
      ]),
      el('div.drawer-body', {}, body),
      opts.footer ? el('div.drawer-foot', {}, opts.footer) : null
    ]);
    var scrim = el('div.modal-scrim', { onclick: close });
    region.appendChild(scrim); region.appendChild(node);
    region.classList.add('show'); region.setAttribute('aria-hidden', 'false');
    function close() { region.classList.remove('show'); region.setAttribute('aria-hidden', 'true'); U.clear(region); if (opts.onClose) opts.onClose(); }
    return { close: close, node: node };
  }

  function confirm(opts) {
    return modal({
      title: opts.title || 'Confirm', subtitle: opts.subtitle, size: opts.size,
      body: el('div', { html: opts.message || '' }),
      actions: [
        { label: opts.cancelLabel || 'Cancel' },
        { label: opts.confirmLabel || 'Confirm', variant: opts.variant || 'primary', onClick: opts.onConfirm }
      ]
    });
  }

  /* ---------- Page head ---------- */
  function pageHead(title, sub, actions) {
    return el('div.page-head', {}, [
      el('div', {}, [
        el('div.ph-title', { text: title }),
        sub ? el('div.ph-sub', { html: sub }) : null
      ]),
      actions ? el('div.ph-actions', {}, actions) : null
    ]);
  }

  /* ---------- KPI ---------- */
  function kpi(o) {
    return el('div.kpi' + (o.accent ? '.kpi-accent-' + o.accent : ''), {}, [
      el('div.kpi-top', {}, [
        o.icon ? el('div.kpi-ico', { text: o.icon }) : null,
        el('div.kpi-label', { text: o.label })
      ]),
      el('div.kpi-val', { text: o.value }),
      (o.sub || o.trend != null) ? el('div.kpi-sub', {}, [
        o.trend != null ? el('span.trend.' + (o.trend > 0 ? 'up' : o.trend < 0 ? 'down' : 'flat'), { text: (o.trend > 0 ? '▲ ' : o.trend < 0 ? '▼ ' : '● ') + Math.abs(o.trend) + (o.trendUnit || '%') }) : null,
        o.sub ? el('span', { text: o.sub }) : null
      ]) : null
    ]);
  }

  /* ---------- Badges ---------- */
  function badge(text, variant, dot) {
    return el('span.badge' + (variant ? '.badge-' + variant : ''), {}, [dot ? el('span.dot') : null, text]);
  }
  var STATUS_MAP = {
    // approval
    approved: 'green', pending: 'amber', pending_approval: 'amber', rejected: 'red', draft: 'neutral', review: 'amber', production: 'green',
    // campaign
    active: 'green', paused: 'amber', live: 'green', qa: 'amber',
    // call / lead
    Connected: 'green', 'No answer': 'neutral', Busy: 'amber', 'Switched off': 'neutral',
    Donated: 'green', Interested: 'blue', Callback: 'amber', 'Not interested': 'neutral', Escalate: 'red',
    New: 'blue', Contacted: 'indigo', Qualified: 'teal', Converted: 'green', Lost: 'neutral',
    // task
    Open: 'blue', Overdue: 'red', Completed: 'green', 'In progress': 'amber', Resolved: 'green',
    // wa
    sent: 'blue', delivered: 'teal', read: 'indigo', replied: 'green', failed: 'red',
    // generic
    confirmed: 'green', blocked: 'red', fallback: 'amber', imported: 'green', needs_approval: 'amber',
    'On track': 'green', Breached: 'red', Met: 'green', Met: 'green'
  };
  function statusBadge(status, dot) {
    var label = String(status || '').replace(/_/g, ' ');
    return badge(label, STATUS_MAP[status] || 'neutral', dot !== false);
  }
  function riskGate(level, label) {
    var L = { green: 'Green · proceed', amber: 'Amber · pilot only', red: 'Red · do not launch' };
    return el('span.riskgate.' + level, {}, [el('span.dot'), label || L[level]]);
  }

  /* ---------- ID chip ---------- */
  function idChip(id, onClick) {
    return el('span.idchip' + (onClick ? '.clickable' : ''), { onclick: onClick ? function (e) { e.stopPropagation(); onClick(); } : null, title: id }, id);
  }

  /* ---------- Person cell ---------- */
  function personCell(name, sub, idForColor) {
    return el('div.cell-person', {}, [
      el('div.av', { style: { background: U.colorFor(idForColor || name) }, text: U.initials(name) }),
      el('div.meta', {}, [el('b', { text: name }), sub ? el('span', { text: sub }) : null])
    ]);
  }
  function avatar(name, id, size) {
    return el('div.av', { style: { background: U.colorFor(id || name), width: (size || 30) + 'px', height: (size || 30) + 'px' }, text: U.initials(name) });
  }

  /* ---------- Table (optional client-side sort + pagination, XC-04) ---------- */
  function table(opts) {
    var cols = opts.columns;
    var allRows = opts.rows || [];
    var pageSize = opts.pageSize || 0; // 0 = no pagination
    var sortState = { key: null, dir: 1 };
    var page = 0;

    function rowCell(c, r, i) {
      var content = c.render ? c.render(r, i) : (c.key ? r[c.key] : '');
      var td = el('td', { class: c.num ? 'col-num' : '' });
      if (content == null) content = '—';
      if (typeof content === 'string' || typeof content === 'number') td.textContent = content;
      else td.appendChild(content);
      return td;
    }
    var tbody = el('tbody');
    function sortedRows() {
      var rows = allRows.slice();
      if (sortState.key) {
        var col = cols.find(function (c) { return (c.label) === sortState.key; });
        rows.sort(function (a, b) {
          var x = col.sortVal ? col.sortVal(a) : (col.key ? a[col.key] : ''), y = col.sortVal ? col.sortVal(b) : (col.key ? b[col.key] : '');
          if (typeof x === 'string') { x = x.toLowerCase(); y = (y || '').toLowerCase(); }
          return (x < y ? -1 : x > y ? 1 : 0) * sortState.dir;
        });
      }
      return rows;
    }
    function renderBody() {
      U.clear(tbody);
      var rows = sortedRows();
      var slice = pageSize ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;
      if (!slice.length) { tbody.appendChild(el('tr', {}, el('td', { colspan: cols.length }, emptyState(opts.empty || { title: 'No records', sub: 'Nothing to show yet.' })))); return; }
      slice.forEach(function (r, i) {
        tbody.appendChild(el('tr' + (opts.onRow ? '.clickable' : ''), { onclick: opts.onRow ? function () { opts.onRow(r, i); } : null }, cols.map(function (c) { return rowCell(c, r, i); })));
      });
      if (footEl) renderFoot();
    }
    var thead = el('thead', {}, el('tr', {}, cols.map(function (c) {
      var sortable = opts.sortable && (c.key || c.sortVal);
      var th = el('th', { class: (c.num ? 'col-num ' : '') + (sortable ? 'sortable' : ''), style: (c.width ? { width: c.width } : {}), 'aria-sort': 'none' });
      th.appendChild(document.createTextNode(c.label || ''));
      if (sortable) {
        th.style.cursor = 'pointer';
        var caret = el('span', { text: ' ↕', style: { opacity: .4, fontSize: '10px' } }); th.appendChild(caret);
        th.addEventListener('click', function () {
          if (sortState.key === c.label) sortState.dir *= -1; else { sortState.key = c.label; sortState.dir = 1; }
          U.$$('th', thead).forEach(function (h) { h.setAttribute('aria-sort', 'none'); var cc = h.querySelector('span'); if (cc) cc.textContent = ' ↕'; });
          th.setAttribute('aria-sort', sortState.dir === 1 ? 'ascending' : 'descending'); caret.textContent = sortState.dir === 1 ? ' ↑' : ' ↓'; caret.style.opacity = 1;
          page = 0; renderBody();
        });
      }
      return th;
    })));
    var footEl = pageSize ? el('div.row-between', { style: { padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-2)' } }) : null;
    function renderFoot() {
      if (!footEl) return; U.clear(footEl);
      var total = allRows.length, pages = Math.ceil(total / pageSize) || 1;
      footEl.appendChild(el('span', { text: 'Showing ' + (page * pageSize + 1) + '–' + Math.min(total, (page + 1) * pageSize) + ' of ' + total }));
      footEl.appendChild(el('div.row.gap-6', {}, [
        el('button.btn.btn-sm', { disabled: page === 0 ? true : null, onclick: function () { if (page > 0) { page--; renderBody(); } } }, '‹ Prev'),
        el('span', { text: (page + 1) + ' / ' + pages, style: { padding: '0 6px' } }),
        el('button.btn.btn-sm', { disabled: page >= pages - 1 ? true : null, onclick: function () { if (page < pages - 1) { page++; renderBody(); } } }, 'Next ›')
      ]));
    }
    renderBody();
    var wrap = el('div', {}, [el('div.tbl-wrap', {}, el('table.tbl' + (opts.compact ? '.tbl-compact' : ''), {}, [thead, tbody]))]);
    if (footEl) { renderFoot(); wrap.appendChild(footEl); }
    return wrap;
  }

  function emptyState(o) {
    return el('div.empty', {}, [
      el('div.e-ico', { text: o.icon || '∅' }),
      el('b', { text: o.title || 'Nothing here' }),
      el('div.t-sm', { text: o.sub || '' }),
      o.action ? el('div.mt-12', {}, o.action) : null
    ]);
  }

  /* ---------- Tabs ---------- */
  function tabs(items, active, onChange) {
    return el('div.tabs', {}, items.map(function (it) {
      return el('button' + (it.id === active ? '.active' : ''), { onclick: function () { onChange(it.id); } }, [
        it.icon ? el('span', { text: it.icon }) : null, it.label,
        it.count != null ? el('span.pill', { text: it.count }) : null
      ]);
    }));
  }

  /* ---------- Card ---------- */
  function card(opts) {
    var children = [];
    if (opts.title) children.push(el('div.card-head', {}, [
      opts.icon ? el('span', { text: opts.icon, style: { fontSize: '16px' } }) : null,
      el('h3', { text: opts.title }),
      opts.right ? el('div.right', {}, opts.right) : null
    ]));
    var bodyChildren = typeof opts.body === 'function' ? opts.body() : opts.body;
    children.push(el('div' + (opts.pad === false ? '' : '.card-body'), {}, bodyChildren));
    if (opts.foot) children.push(el('div.card-foot', {}, opts.foot));
    return el('div.card' + (opts.cls ? '.' + opts.cls : ''), {}, children);
  }

  /* ---------- Misc ---------- */
  function bar(pct, variant) {
    return el('div.bar' + (variant ? '.' + variant : ''), {}, el('span', { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }));
  }
  function note(kind, html, icon) {
    var ics = { info: 'ℹ', amber: '⚠', green: '✓', red: '✕', violet: '✨' };
    return el('div.note.note-' + kind, {}, [el('span.ni', { text: icon || ics[kind] || 'ℹ' }), el('div', { html: html })]);
  }
  function aiBlock(title, bodyEls) {
    return el('div.ai-block', {}, [
      el('div.ai-head', {}, [el('span.spark', { text: '✨' }), title || 'AI Assist · Gemini']),
      el('div', {}, bodyEls)
    ]);
  }
  function statline(label, val) {
    return el('div.statline', {}, [el('span.sl-label', { text: label }), el('span.sl-val', typeof val === 'string' || typeof val === 'number' ? { text: val } : {}, typeof val === 'object' ? val : null)]);
  }
  function switchToggle(on, onToggle) {
    var s = el('div.switch' + (on ? '.on' : ''), { role: 'switch', 'aria-checked': on, tabindex: '0' });
    s.addEventListener('click', function () { s.classList.toggle('on'); onToggle(s.classList.contains('on')); });
    return s;
  }
  function checkbox(on, onToggle) {
    var c = el('div.chk' + (on ? '.on' : ''), {}, el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>' }));
    c.addEventListener('click', function (e) { e.stopPropagation(); c.classList.toggle('on'); onToggle(c.classList.contains('on')); });
    return c;
  }

  function consentBadges(consent) {
    var out = [];
    if (consent.dnd) out.push(badge('DND', 'red', true));
    if (consent.optOut) out.push(badge('Opt-out', 'amber', true));
    if (!consent.dnd && !consent.optOut) out.push(badge('Consented', 'green', true));
    return el('div.row.gap-4', {}, out);
  }

  // mini bar chart
  function barChart(data, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, data.map(function (d) { return d.v; }).concat([1]));
    return el('div.barchart', {}, data.map(function (d) {
      return el('div.bc', {}, [
        opts.showVal ? el('div.bcv', { text: d.label2 || '' }) : null,
        el('div.bcb', { style: { height: Math.max(3, d.v / max * 100) + '%' }, title: d.v }),
        el('div.bcl', { text: d.label })
      ]);
    }));
  }

  // SLA badge with live state (MI-05)
  function slaBadge(kind, item) {
    var st = App.store.slaState(kind, item);
    if (st.state === 'none') return null;
    var v = st.state === 'breached' ? 'red' : st.state === 'at_risk' ? 'amber' : 'green';
    return badge(st.label, v, true);
  }

  // comment thread (MI-07)
  function commentThread(entityType, id) {
    var e = App.store.findEntity(entityType, id);
    var comments = (e && e.comments) || [];
    var wrap = el('div', {});
    var list = el('div.col.gap-8', {}, comments.length ? comments.map(function (c) {
      return el('div.row.gap-8', { style: { alignItems: 'flex-start' } }, [
        avatar((App.store.user(c.by) || {}).name || c.by, c.by, 26),
        el('div', { style: { flex: 1 } }, [
          el('div.row.gap-6', {}, [el('b.t-sm', { text: (App.store.user(c.by) || {}).name || c.by }), el('span.t-xs.t-mut3', { text: U.ago(c.ts) })]),
          el('div.t-sm', { html: U.escapeHtml(c.text).replace(/@(\w+)/g, '<b style="color:var(--accent)">@$1</b>') })
        ])
      ]);
    }) : [el('div.t-xs.t-mut3', { text: 'No comments yet. @mention a teammate to notify them.' })]);
    var inp = el('input.input', { placeholder: 'Add a comment… use @Name to mention', style: { flex: 1 } });
    function send() { var t = inp.value.trim(); if (!t) return; App.store.actions.addComment(entityType, id, t); inp.value = ''; }
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') send(); });
    wrap.appendChild(list);
    wrap.appendChild(el('div.row.gap-8.mt-12', {}, [inp, el('button.btn.btn-sm.btn-primary', { onclick: send }, 'Post')]));
    return wrap;
  }

  // funnel
  function funnel(steps) {
    var max = Math.max.apply(null, steps.map(function (s) { return s.v; }).concat([1]));
    return el('div', {}, steps.map(function (s) {
      return el('div.funnel-step', {}, [
        el('div.fs-bar', { style: { width: Math.max(8, s.v / max * 100) + '%' }, text: U.num(s.v) }),
        el('div.fs-meta', {}, [el('b', { text: s.label }), s.sub ? el('span', { text: ' · ' + s.sub }) : null])
      ]);
    }));
  }

  return {
    toast: toast, modal: modal, drawer: drawer, confirm: confirm,
    pageHead: pageHead, kpi: kpi, badge: badge, statusBadge: statusBadge, riskGate: riskGate,
    idChip: idChip, personCell: personCell, avatar: avatar, table: table, emptyState: emptyState,
    tabs: tabs, card: card, bar: bar, note: note, aiBlock: aiBlock, statline: statline,
    switchToggle: switchToggle, checkbox: checkbox, consentBadges: consentBadges,
    barChart: barChart, funnel: funnel, slaBadge: slaBadge, commentThread: commentThread
  };
})();
