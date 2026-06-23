/* ============================================================
   Screen: Rework Queue — done vs needs-improvement (MI-02)
   ============================================================ */
App.screens['rework'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var view = 'open';

  function render() {
    var s = store.get();
    var all = store.scoped(s.reworks || []);
    var shown = view === 'all' ? all : all.filter(function (r) { return r.status === view; });
    shown = U.sortBy(shown, function (r) { return new Date(r.ts).getTime(); });

    return el('div', {}, [
      ui.pageHead('Rework Queue', 'Items a reviewer flagged as <b>needs improvement</b> — the quality feedback loop. Each carries a reason, owner and age until it is reworked and resolved.', [
        ui.badge(all.filter(function (r) { return r.status === 'open'; }).length + ' open', 'amber')
      ]),
      el('div.grid.cols-3.mb-16', {}, [
        ui.kpi({ icon: '🔁', label: 'Open rework', value: all.filter(function (r) { return r.status === 'open'; }).length, accent: 'amber' }),
        ui.kpi({ icon: '✓', label: 'Resolved', value: all.filter(function (r) { return r.status === 'resolved'; }).length, accent: 'green' }),
        ui.kpi({ icon: '⏱️', label: 'Oldest open', value: all.filter(function (r) { return r.status === 'open'; }).length ? U.ago(U.sortBy(all.filter(function (r) { return r.status === 'open'; }), function (r) { return new Date(r.ts).getTime(); })[0].ts) : '—', accent: 'red' })
      ]),
      el('div.chips.mb-12', {}, [chip('open', 'Open'), chip('resolved', 'Resolved'), chip('all', 'All')]),
      shown.length ? ui.card({ pad: false, body: [ui.table({ sortable: true, columns: [
        { label: 'Item', key: 'entityId', render: function (r) { return el('div', {}, [el('b.t-sm', { text: r.entityId }), el('div.t-xs.t-mut', { text: r.entityType })]); } },
        { label: 'Reason', key: 'reason', render: function (r) { return el('span.t-sm', { text: r.reason }); } },
        { label: 'Flagged by', render: function (r) { return (store.user(r.by) || {}).name; } },
        { label: 'Owner', render: function (r) { return (store.user(r.ownerId) || {}).name; } },
        { label: 'Age', sortVal: function (r) { return new Date(r.ts).getTime(); }, render: function (r) { return U.ago(r.ts); } },
        { label: 'Status', render: function (r) { return ui.statusBadge(r.status === 'open' ? 'Open' : 'Resolved'); } },
        { label: '', render: function (r) { return r.status === 'open' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.resolveRework(r.id); ui.toast({ kind: 'success', msg: 'Resolved.' }); } }, '✓ Resolve') : '—'; } }
      ], rows: shown })] }) : ui.card({ body: [ui.emptyState({ icon: '✓', title: 'No rework here', sub: 'Reviewers can flag items as "needs improvement" from calls, content, scripts and records.' })] })
    ]);
  }
  function chip(v, label) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label); }
  return { render: render, title: 'Rework Queue' };
})();
