/* ============================================================
   Screen: Service Continuity & Fallback (shared S10)
   ============================================================ */
App.screens['continuity'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  function render() {
    var s = store.get();
    var c = s.continuity;
    var active = c.incidents.filter(function (i) { return i.status !== 'resolved'; });
    var fallbackOn = c.incidents.filter(function (i) { return i.status === 'fallback-active'; });

    return el('div', {}, [
      ui.pageHead('Service Continuity & Fallback', 'If an automation, API, dashboard or vendor fails, each workflow degrades to a <b>defined manual path</b> with daily reconciliation. No manually-captured record bypasses reconciliation into CRM. Donor-facing continuity has priority.', null),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🟢', label: 'Systems healthy', value: (s.apiRegistry.filter(function (a) { return a.status === 'confirmed'; }).length) + '/' + s.apiRegistry.length, accent: 'green' }),
        ui.kpi({ icon: '🛟', label: 'Fallbacks active', value: fallbackOn.length, accent: 'amber' }),
        ui.kpi({ icon: '🚨', label: 'Open incidents', value: active.length, accent: active.length ? 'red' : 'green' }),
        ui.kpi({ icon: '🔄', label: 'Records bypassing CRM', value: 0, accent: 'green', sub: 'reconciliation enforced' })
      ]),
      ui.card({ title: 'Post-incident review (5 steps)', icon: '🔁', cls: 'mb-16', body: [
        el('div.steps', {}, c.steps.map(function (st, i) { return el('div.step.done', {}, [el('div.sc', { text: i + 1 }), el('span.sl', { text: st }), i < c.steps.length - 1 ? el('span.line') : null]); }))
      ] }),
      el('div.col.gap-12', {}, c.incidents.map(incidentCard))
    ]);
  }

  function incidentCard(i) {
    var statusMap = { 'fallback-active': ['Fallback active', 'amber'], 'monitoring': ['Monitoring', 'blue'], 'resolved': ['Resolved', 'green'] };
    var sm = statusMap[i.status] || ['Open', 'red'];
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [el('div.row.gap-8', {}, [el('b', { text: i.system }), ui.badge(sm[0], sm[1], true)]), el('div.t-sm.t-mut.mt-2', { text: i.impact })]),
        el('span.t-xs.t-mut3', { text: 'since ' + U.ago(i.startedAt) })
      ]),
      el('div.note.note-amber.mt-12', {}, [el('span.ni', { text: '🛟' }), el('div', {}, [el('b.t-sm', { text: 'Fallback: ' }), el('span.t-sm', { text: i.fallback })])]),
      el('div.row-between.mt-8', { style: { alignItems: 'center' } }, [
        el('span.t-xs.t-mut', { text: 'Reconciliation: ' + i.reconciliation + ' · owner ' + (store.user(i.owner) || {}).name }),
        i.status !== 'resolved' ? el('button.btn.btn-sm.btn-success', { onclick: function () { store.actions.resolveIncident(i.id); ui.toast({ kind: 'success', msg: 'Incident closed & reconciled.' }); } }, '✓ Close & reconcile') : ui.badge('Closed', 'green')
      ])
    ] });
  }

  return { render: render, title: 'Service Continuity' };
})();
