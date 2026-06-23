/* ============================================================
   Screen: WF-006 API Registry & Dependency Watch
   ============================================================ */
App.screens['wf006-api-registry'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var reg = s.apiRegistry;
    var byStatus = function (st) { return reg.filter(function (r) { return r.status === st; }).length; };

    return el('div', {}, [
      ui.pageHead('API Registry & Dependency Watch', 'Live integration health — every dependency carries provider, status, owner, blocker, cost and a defined <b>fallback</b>. This is the single source of truth for production-readiness.', [
        ui.badge(byStatus('confirmed') + ' confirmed', 'green'),
        ui.badge(byStatus('pending') + byStatus('fallback') + ' pending/fallback', 'amber'),
        ui.badge(byStatus('blocked') + ' blocked', 'red')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🔌', label: 'Integrations tracked', value: reg.length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Confirmed', value: byStatus('confirmed'), accent: 'green' }),
        ui.kpi({ icon: '⏳', label: 'Pending / fallback', value: byStatus('pending') + byStatus('fallback'), accent: 'amber' }),
        ui.kpi({ icon: '⛔', label: 'Blocked', value: byStatus('blocked'), accent: 'red' })
      ]),
      ui.card({ pad: false, body: [
        ui.table({ columns: [
          { label: 'Integration', render: function (r) { return el('div', {}, [el('b.t-sm', { text: r.name }), el('div.t-xs.t-mut', { text: r.provider + ' · ' + r.access })]); } },
          { label: 'Workflows', render: function (r) { return el('div.row.gap-4', {}, r.workflows.map(function (w) { return ui.badge(w, 'neutral'); })); } },
          { label: 'Priority', render: function (r) { return ui.badge(r.priority, r.priority === 'P0' ? 'red' : 'amber'); } },
          { label: 'Status', render: function (r) { return ui.statusBadge(r.status, true); } },
          { label: 'Owner', render: function (r) { return (store.user(r.owner) || { name: r.owner }).name; } },
          { label: 'Uptime (30d)', render: function (r) { return el('div.row.gap-8', {}, [sparkline(r.uptimeHistory), el('span.t-xs', { text: r.uptime != null ? r.uptime + '%' : '—' })]); } },
          { label: 'Last test', render: function (r) { return r.lastTest ? ui.badge(r.lastTest, r.lastTest === 'ok' ? 'green' : r.lastTest === 'slow' ? 'amber' : 'red') : el('span.t-mut', { text: '—' }); } },
          { label: '', render: function (r) { return el('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); store.actions.testApi(r.id); ui.toast({ kind: 'info', title: 'Testing ' + r.name + '…', msg: 'Connection check (simulated).' }); } }, '⚡ Test'); } }
        ], rows: reg, onRow: detail })
      ] }),
      el('div.t-xs.t-mut3.mt-8', { text: 'Click a row for blocker detail. Cost note: generation / voice / WhatsApp / ad APIs are billed centrally (see Usage & Cost).' })
    ]);
  }

  function detail(r) {
    ui.drawer({
      title: r.name, subtitle: r.provider + ' · ' + r.priority,
      body: [
        el('div.row.gap-8.mb-12', {}, [ui.statusBadge(r.status, true), el('span.t-sm.t-mut', { text: r.access })]),
        ui.statline('Workflows', el('div.row.gap-4', {}, r.workflows.map(function (w) { return ui.badge(w, 'neutral'); }))),
        ui.statline('Owner', (store.user(r.owner) || { name: r.owner }).name),
        ui.statline('Cost model', r.cost),
        ui.statline('Uptime', r.uptime != null ? r.uptime + '%' : 'Not live'),
        ui.statline('Fallback path', r.fallbackMode),
        r.blocker ? ui.note('amber', '<b>Blocker:</b> ' + r.blocker, '⚠') : ui.note('green', 'No blockers — production-ready.', '✓'),
        el('div.mt-12', {}, [el('div.t-up.mb-4', { text: '30-day uptime' }), sparkline(r.uptimeHistory, true), el('div.t-xs.t-mut3.mt-4', { text: 'Last checked ' + (r.lastChecked ? U.ago(r.lastChecked) : '—') })]),
        el('div.row.gap-8.mt-12', {}, [
          el('button.btn.grow', { onclick: function () { store.actions.testApi(r.id); ui.toast({ kind: 'info', msg: 'Tested — see "Last test".' }); } }, '⚡ Test connection'),
          r.status !== 'confirmed' ? el('button.btn.grow', { onclick: function () { ui.toast({ kind: 'info', msg: 'Fallback active: ' + r.fallbackMode }); } }, 'Activate fallback') : null
        ])
      ]
    });
  }

  function sparkline(hist, big) {
    if (!hist || !hist.length) return el('span.t-mut', { text: '—' });
    var w = big ? 280 : 80, h = big ? 40 : 18, n = hist.length;
    var svgns = 'http://www.w3.org/2000/svg'; var svg = document.createElementNS(svgns, 'svg'); svg.setAttribute('width', w); svg.setAttribute('height', h);
    hist.forEach(function (d, i) { var bar = document.createElementNS(svgns, 'rect'); var bh = Math.max(1, d.up / 100 * h); bar.setAttribute('x', i * (w / n)); bar.setAttribute('y', h - bh); bar.setAttribute('width', (w / n) - 1); bar.setAttribute('height', bh); bar.setAttribute('fill', d.up >= 99 ? '#10b981' : d.up >= 90 ? '#f59e0b' : '#ef4444'); svg.appendChild(bar); });
    return svg;
  }

  return { render: render, title: 'API Registry' };
})();
