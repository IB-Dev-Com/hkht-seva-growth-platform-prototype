/* ============================================================
   Screen: WF-006 Data Quality & Governance dashboard
   ============================================================ */
App.screens['wf006-quality'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;

  function render() {
    var s = store.get();
    var cs = s.contacts;
    var n = cs.length;
    var avg = Math.round(U.sum(cs, function (c) { return c.dqScore; }) / n);
    var withSource = cs.filter(function (c) { return c.source; }).length;
    var consented = cs.filter(function (c) { return !c.consent.dnd && !c.consent.optOut; }).length;
    var invalidPhone = cs.filter(function (c) { return !/\d{5}/.test(c.mobile); }).length + 3;
    var noEmail = cs.filter(function (c) { return !c.email; }).length;
    var dupRisk = cs.filter(function (c) { return c.dupRisk > 50; }).length;
    var stale = cs.filter(function (c) { return (U.now() - new Date(c.lastTouch)) / 86400000 > 30; }).length;

    // dq distribution
    var dist = [
      { label: '90-100', v: cs.filter(function (c) { return c.dqScore >= 90; }).length },
      { label: '80-89', v: cs.filter(function (c) { return c.dqScore >= 80 && c.dqScore < 90; }).length },
      { label: '70-79', v: cs.filter(function (c) { return c.dqScore >= 70 && c.dqScore < 80; }).length },
      { label: '60-69', v: cs.filter(function (c) { return c.dqScore >= 60 && c.dqScore < 70; }).length },
      { label: '<60', v: cs.filter(function (c) { return c.dqScore < 60; }).length }
    ];

    // owner coverage
    var byOwner = U.group(cs, 'ownerId');
    var ownerRows = Object.keys(byOwner).map(function (oid) {
      var arr = byOwner[oid];
      return { owner: (store.user(oid) || { name: oid }).name, count: arr.length, avgDq: Math.round(U.sum(arr, function (c) { return c.dqScore; }) / arr.length) };
    });

    var exceptions = [
      { icon: '📵', label: 'Missing source tag', count: n - withSource, color: 'amber', filter: 'nosource' },
      { icon: '☎️', label: 'Invalid / unverified phone', count: invalidPhone, color: 'red', filter: 'all' },
      { icon: '🔗', label: 'High duplicate risk', count: dupRisk, color: 'red', filter: 'all', href: '#/wf006/dedupe' },
      { icon: '🕸️', label: 'Stale (>30d no touch)', count: stale, color: 'amber', filter: 'all' },
      { icon: '✉️', label: 'Missing email', count: noEmail, color: 'neutral', filter: 'all' }
    ];

    return el('div', {}, [
      ui.pageHead('Data Quality & Governance', 'Completeness, duplicates, source coverage, consent and stale-record health — the gate metrics before WF-002 / WF-003 scale.', [
        el('a.btn', { href: '#/wf006/api' }, '🔌 API health'),
        el('a.btn.btn-primary', { href: '#/wf006/contacts?f=nosource' }, 'Fix exceptions')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🧹', label: 'Avg data quality', value: avg + '/100', accent: avg >= 85 ? 'green' : 'amber', trend: 3.2 }),
        ui.kpi({ icon: '🏷️', label: 'Source coverage', value: Math.round(withSource / n * 100) + '%', accent: 'indigo' }),
        ui.kpi({ icon: '🛡️', label: 'Consent / DND clean', value: Math.round(consented / n * 100) + '%', accent: 'green' }),
        ui.kpi({ icon: '🆔', label: 'ID completion', value: '98%', accent: 'green', sub: 'Contact_ID on all records' })
      ]),
      el('div.grid', { style: { gridTemplateColumns: '1.3fr 1fr', gap: '16px', alignItems: 'start' } }, [
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Data quality distribution', icon: '📊', body: [ui.barChart(dist.map(function (d) { return { label: d.label, v: d.v }; }))] }),
          ui.card({ title: 'Owner coverage', icon: '👥', body: [ui.table({ compact: true, columns: [
            { label: 'Owner', key: 'owner' },
            { label: 'Records', num: true, key: 'count' },
            { label: 'Avg DQ', num: true, render: function (r) { return el('span.t-semi', { text: r.avgDq, style: { color: r.avgDq >= 85 ? 'var(--green-600)' : 'var(--amber-600)' } }); } },
            { label: '', render: function (r) { return ui.bar(r.avgDq, r.avgDq >= 85 ? 'green' : 'amber'); } }
          ], rows: U.sortBy(ownerRows, function (r) { return r.count; }, 'desc') })] })
        ]),
        el('div.col.gap-16', {}, [
          ui.card({ title: 'Exception queues', icon: '⚠️', body: exceptions.map(function (ex) {
            return el('a', { href: ex.href || '#/wf006/contacts', style: { textDecoration: 'none', display: 'block' } }, el('div.row-between', { style: { padding: '10px 0', borderBottom: '1px solid var(--border)' } }, [
              el('div.row.gap-8', {}, [el('span', { text: ex.icon }), el('span.t-sm', { text: ex.label })]),
              ui.badge(ex.count, ex.color)
            ]));
          }) }),
          ui.card({ title: 'Governance gate', icon: '🚦', body: [
            ui.note('green', '<b>WF-006 gate status: open.</b> Contact_ID rules, duplicate policy, source fields and consent/DND model are approved — WF-002 and WF-003 may scale against this data.', '✓'),
            el('div.mt-8', {}, [
              ui.statline('Contact_ID rules', ui.badge('Approved', 'green')),
              ui.statline('Duplicate policy', ui.badge('Approved', 'green')),
              ui.statline('Source fields', ui.badge('Approved', 'green')),
              ui.statline('Consent / DND model', ui.badge('Approved', 'green'))
            ])
          ] })
        ])
      ])
    ]);
  }

  return { render: render, title: 'Data Quality' };
})();
