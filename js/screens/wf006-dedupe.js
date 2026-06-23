/* ============================================================
   Screen: WF-006 Dedupe & Identity Resolution
   ============================================================ */
App.screens['wf006-dedupe'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var filter = 'pending';

  function render() {
    var s = store.get();
    var merges = s.merges.filter(function (m) { return filter === 'all' || m.status === filter; });
    var pending = s.merges.filter(function (m) { return m.status === 'pending'; });
    var hv = s.merges.filter(function (m) { return m.highValue && m.status === 'pending'; });

    return el('div', {}, [
      ui.pageHead('Deduplication & Identity Resolution', 'AI fuzzy-matches duplicates across Hello Leads, CRM, Sheets and Yatra/donor lists. <b>The merge decision stays with a human</b> — high-value donor records are never auto-merged.', [
        ui.badge(pending.length + ' to review', 'amber'), hv.length ? ui.badge(hv.length + ' high-value', 'red') : null
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '🔗', label: 'Duplicate clusters', value: s.merges.length, accent: 'indigo' }),
        ui.kpi({ icon: '⏳', label: 'Awaiting human review', value: pending.length, accent: 'amber' }),
        ui.kpi({ icon: '🛡️', label: 'High-value (no auto-merge)', value: s.merges.filter(function (m) { return m.highValue; }).length, accent: 'red' }),
        ui.kpi({ icon: '✓', label: 'Resolved', value: s.merges.filter(function (m) { return m.status !== 'pending'; }).length, accent: 'green' })
      ]),
      el('div.chips.mb-12', {}, [fchip('pending', 'Pending'), fchip('merged', 'Merged'), fchip('no-merge', 'No-merge'), fchip('all', 'All')]),
      el('div.col.gap-12', {}, merges.length ? merges.map(mergeCard) : [ui.card({ body: [ui.emptyState({ icon: '✓', title: 'Nothing to review', sub: 'No clusters in this view.' })] })])
    ]);
  }

  function fchip(v, label) { return el('div.fchip' + (filter === v ? '.active' : ''), { onclick: function () { filter = v; store.emit(); } }, label); }

  function mergeCard(m) {
    var a = m.records[0], b = m.records[1];
    return ui.card({ body: [
      el('div.row-between.mb-12', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.row.gap-8', {}, [ui.idChip(m.id), ui.badge(m.confidence + '% match', m.confidence > 90 ? 'red' : 'amber'), m.highValue ? ui.badge('High-value · manual only', 'red', true) : null, m.status !== 'pending' ? ui.statusBadge(m.status === 'merged' ? 'Resolved' : 'no-merge') : null]),
        el('div.row.gap-6', {}, (m.signals || []).map(function (sig) { return ui.badge(sig, 'neutral'); }))
      ]),
      m.note ? ui.note('amber', m.note, '🛡️') : null,
      el('div.grid.cols-2.mt-12', { style: { gap: '12px' } }, [recordBox(a, 'Record A — keep'), recordBox(b, 'Record B — merge in')]),
      m.status === 'pending' ? el('div.row.gap-8.mt-16', {}, [
        el('button.btn.btn-success', { onclick: function () { resolver(m); } }, [el('span.ico', { text: '🔗' }), 'Review & merge fields…']),
        el('button.btn', { onclick: function () { decide(m, 'no-merge'); } }, [el('span.ico', { text: '⛔' }), 'Mark no-merge (keep separate)']),
        el('div.grow'),
        el('span.t-xs.t-mut3', { text: 'Reviewer: ' + (store.user(m.reviewerId) || {}).name })
      ]) : el('div.t-xs.t-mut3.mt-12', { text: (m.status === 'merged' ? 'Merged' : 'Kept separate') + ' by ' + (store.user(m.reviewerId) || {}).name + (m.decidedAt ? ' · ' + U.ago(m.decidedAt) : '') })
    ] });
  }

  function recordBox(r, label) {
    return el('div', { style: { border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--surface-2)' } }, [
      el('div.t-up.mb-8', { text: label }),
      el('div.row.gap-8', {}, [ui.avatar(r.name, r.contactId, 32), el('div', {}, [el('b.t-sm', { text: r.name }), el('div.t-xs.t-mut.t-mono', { text: r.mobile })])]),
      el('div.mt-8', {}, [
        ui.statline('Contact_ID', store.contact(r.contactId) ? ui.idChip(r.contactId, function () { App.router.go('/wf006/contact/' + r.contactId); }) : ui.idChip(r.contactId)),
        ui.statline('Source', store.source(r.source).label),
        ui.statline('Created', U.fmtDate(r.created)),
        ui.statline('DQ score', r.dq + '/100')
      ])
    ]);
  }

  /* ST-02: field-level merge resolver with preview */
  function resolver(m) {
    var a = m.records[0], b = m.records[1];
    var fields = [['name', 'Name'], ['mobile', 'Mobile'], ['source', 'Source'], ['created', 'Created'], ['dq', 'DQ score']];
    var pick = {}; fields.forEach(function (f) { pick[f[0]] = String(a[f[0]]).length >= String(b[f[0]]).length ? 'A' : 'B'; });
    function preview() { var o = {}; fields.forEach(function (f) { o[f[0]] = pick[f[0]] === 'A' ? a[f[0]] : b[f[0]]; }); return o; }
    var previewBox = el('div');
    function renderPreview() { U.clear(previewBox); var p = preview(); previewBox.appendChild(el('div', { style: { background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: '9px', padding: '12px' } }, [el('div.t-up.mb-4', { text: '✓ Surviving record (preview)' })].concat(fields.map(function (f) { return ui.statline(f[1], String(p[f[0]])); })))); }
    var rows = fields.map(function (f) {
      function opt(side, val) {
        return el('label.row.gap-6', { style: { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', flex: 1, background: pick[f[0]] === side ? 'var(--accent-soft)' : '' } }, [
          el('input', { type: 'radio', name: 'mf-' + f[0], checked: pick[f[0]] === side ? true : null, onchange: function () { pick[f[0]] = side; renderPreview(); renderRows(); } }),
          el('div', {}, [el('div.t-xs.t-mut', { text: 'Record ' + side }), el('b.t-sm', { text: String(val == null || val === '' ? '∅' : (f[0] === 'created' ? U.fmtDate(val) : f[0] === 'source' ? store.source(val).label : val)) })])
        ]);
      }
      return el('div', { style: { marginBottom: '8px' } }, [el('div.t-up.mb-4', { text: f[1] }), el('div.row.gap-8', {}, [opt('A', a[f[0]]), opt('B', b[f[0]])])]);
    });
    var rowsWrap = el('div'); function renderRows() {} // radios update via name grouping
    ui.modal({ title: 'Resolve merge — pick the surviving value per field', subtitle: m.confidence + '% match' + (m.highValue ? ' · HIGH-VALUE DONOR' : ''), size: 'lg',
      body: el('div', {}, [
        m.highValue ? ui.note('red', '<b>High-value donor.</b> Conflicting donation history — confirm each field. Loser is archived with a pointer; full history preserved.', '🛡️') : ui.note('info', 'Choose which value survives per field. The loser record is archived (not deleted) with a pointer to the survivor.', '🔗'),
        el('div.grid.cols-2.mt-12', { style: { gap: '16px', alignItems: 'start' } }, [el('div', {}, rows), previewBox])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Confirm merge', variant: 'success', onClick: function () { store.actions.mergeResolve(m.id, { pick: pick, survivor: preview() }); ui.toast({ kind: 'success', title: 'Merged', msg: 'Field-level resolution saved; history + audit note recorded.' }); } }]
    });
    renderPreview();
  }

  function decide(m, decision) {
    if (m.highValue && decision === 'merged') {
      ui.confirm({ title: 'High-value donor merge', variant: 'danger', message: 'This cluster involves a <b>high-value donor</b> with conflicting donation history. Platform rule requires explicit human confirmation. Proceed with merge?', confirmLabel: 'Yes, merge & log', onConfirm: function () { store.actions.mergeDecision(m.id, decision); ui.toast({ kind: 'success', title: 'Merged', msg: 'Full history kept + audit note recorded.' }); } });
      return;
    }
    store.actions.mergeDecision(m.id, decision);
    ui.toast({ kind: 'success', msg: decision === 'merged' ? 'Records merged — history preserved.' : 'Kept separate — flagged no-merge.' });
  }

  return { render: render, title: 'Dedupe & Identity' };
})();
