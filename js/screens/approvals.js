/* ============================================================
   Screen: Approvals — unified human-in-the-loop queue (AP-01..06)
   ============================================================ */
App.screens['approvals'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store, router = App.router;
  var view = 'pending';
  var mineOnly = false;
  var selected = {};

  function render(params, query) {
    var s = store.get();
    var role = store.getSession().role;
    var all = U.sortBy(s.approvals, function (a) { return new Date(a.createdAt).getTime(); }, 'desc');
    var pending = all.filter(function (a) { return a.status === 'pending'; });
    var mine = pending.filter(function (a) { return a.approverRole === role; });
    var base = view === 'pending' ? pending : view === 'decided' ? all.filter(function (a) { return a.status !== 'pending'; }) : view === 'mydecisions' ? all.filter(function (a) { return a.decisionBy === store.getSession().userId; }) : all;
    var shown = (mineOnly && view === 'pending') ? base.filter(function (a) { return a.approverRole === role; }) : base;

    setTimeout(function () { if (query && query.focus) { var a = s.approvals.find(function (x) { return x.id === query.focus; }); if (a && a.status === 'pending') openReview(a); } }, 50);

    var selectable = shown.filter(function (a) { return a.status === 'pending' && a.priority !== 'High'; });
    var selCount = Object.keys(selected).filter(function (k) { return selected[k]; }).length;

    return el('div', {}, [
      ui.pageHead('Approvals', 'The platform-wide human-in-the-loop queue. AI prepares decision-quality context; <b>a human decides</b> — with the actual artifact in view. Every action is logged.', [
        el('button.btn', { onclick: openDelegate }, [el('span.ico', { text: '🤝' }), 'Delegate / OOO']),
        ui.badge(mine.length + ' for your role', 'amber')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '⏳', label: 'Pending', value: pending.length, accent: 'amber' }),
        ui.kpi({ icon: '🔴', label: 'SLA breached', value: pending.filter(function (a) { return store.slaState('approval', a).state === 'breached'; }).length, accent: 'red' }),
        ui.kpi({ icon: '👤', label: 'Awaiting your role', value: mine.length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Decided', value: all.filter(function (a) { return a.status !== 'pending'; }).length, accent: 'green' })
      ]),
      el('div.row-between.mb-12', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.chips', {}, [chip('pending', 'Pending', pending.length), chip('decided', 'Decided'), chip('mydecisions', 'My decisions'), chip('all', 'All')]),
        view === 'pending' ? el('label.row.gap-6', { style: { cursor: 'pointer' } }, [ui.checkbox(mineOnly, function (v) { mineOnly = v; store.emit(); }), el('span.t-sm', { text: 'Only items needing my role' })]) : null
      ]),
      selCount ? el('div.note.note-info.mb-12', {}, [el('span.ni', { text: '☑' }), el('div.row-between', { style: { flex: 1, alignItems: 'center' } }, [el('span', { text: selCount + ' low-risk selected' }), el('button.btn.btn-sm.btn-success', { onclick: function () { bulkApprove(); } }, 'Bulk approve ' + selCount)])]) : null,
      view === 'mydecisions' ? myDecisionsSummary(all) : null,
      el('div.col.gap-10', {}, shown.length ? shown.map(function (a) { return card(a, selectable.indexOf(a) > -1); }) : [ui.card({ body: [ui.emptyState({ icon: '✅', title: 'Nothing here', sub: 'No items in this view.' })] })])
    ]);
  }

  function myDecisionsSummary(all) {
    var mine = all.filter(function (a) { return a.decisionBy === store.getSession().userId; });
    var appr = mine.filter(function (a) { return a.status === 'approved'; }).length;
    return ui.card({ cls: 'mb-12', body: [el('div.row.gap-24', {}, [
      ui.statline('Decisions made', mine.length), ui.statline('Approved', appr), ui.statline('Rejected', mine.length - appr), ui.statline('Avg turnaround', '4.2h')
    ])] });
  }

  function chip(v, label, count) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; selected = {}; store.emit(); } }, label + (count != null ? ' · ' + count : '')); }

  function card(a, selectable) {
    var sla = store.slaState('approval', a);
    var breached = a.status === 'pending' && sla.state === 'breached';
    return ui.card({ cls: 'card-hover', body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div.row.gap-10', { style: { flex: 1, minWidth: 0, alignItems: 'flex-start' } }, [
          selectable ? ui.checkbox(!!selected[a.id], function (v) { selected[a.id] = v; }) : el('span', { style: { width: '17px' } }),
          el('div', { style: { flex: 1, minWidth: 0, cursor: a.status === 'pending' ? 'pointer' : 'default' }, onclick: a.status === 'pending' ? function () { openReview(a); } : null }, [
            el('div.row.gap-6', { style: { flexWrap: 'wrap' } }, [ui.badge(a.type, 'indigo'), a.priority === 'High' ? ui.badge('High', 'red') : null, breached ? ui.badge('SLA breached', 'red', true) : (a.status === 'pending' && sla.state === 'at_risk' ? ui.badge('SLA at risk', 'amber', true) : null), a.status === 'info_requested' ? ui.badge('info requested', 'amber') : null, ui.idChip(a.entityId)].filter(Boolean)),
            el('div.t-semi.mt-4', { text: a.title }),
            el('div.t-xs.t-mut.mt-2', { text: 'by ' + (store.user(a.requestedBy) || {}).name + ' · ' + U.ago(a.createdAt) + ' · needs ' + store.roleLabel(a.approverRole) })
          ])
        ]),
        a.status === 'pending' ? el('div.row.gap-6', {}, [
          el('button.btn.btn-sm', { onclick: function (e) { e.stopPropagation(); openReview(a); } }, 'Review'),
          el('button.btn.btn-sm.btn-success', { onclick: function (e) { e.stopPropagation(); decide(a, 'approved'); } }, '✓')
        ]) : el('div.col', { style: { alignItems: 'flex-end' } }, [ui.statusBadge(a.status), el('div.t-xs.t-mut3.mt-4', { text: 'by ' + (store.user(a.decisionBy) || {}).name })])
      ])
    ] });
  }

  /* ---- AP-01: render the actual artifact by entity type ---- */
  function artifact(a) {
    var s = store.get();
    if (a.entity === 'script') {
      var sc = s.scripts.find(function (x) { return x.id === a.entityId; });
      if (sc) return el('div', {}, [el('div.t-up.mb-4', { text: 'Script — ' + sc.name + ' ' + sc.version }), el('div', { style: { background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontStyle: 'italic', fontSize: '12.5px' } }, '“' + sc.opening + '”'), el('div.row.gap-4.mt-8', { style: { flexWrap: 'wrap' } }, sc.outcomeCodes.map(function (o) { return ui.badge(o, 'neutral'); }))]);
    }
    if (a.entity === 'content') {
      var ct = s.content.find(function (x) { return x.id === a.entityId; });
      if (ct) return el('div', {}, [el('div.t-up.mb-4', { text: 'Creative variants' })].concat(ct.variants.map(function (v) { return el('div', { style: { border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginBottom: '6px' } }, [el('b.t-sm', { text: v.headline }), el('div.t-xs.t-mut.mt-2', { text: v.body }), el('div.mt-4', {}, ui.badge(v.cta, 'saffron'))]); })));
    }
    if (a.entity === 'campaign' || a.entity === 'budget') {
      var c = s.campaigns.find(function (x) { return x.id === a.entityId; });
      if (c) return el('div', {}, [el('div.t-up.mb-4', { text: 'Campaign / budget' }), ui.statline('Budget ceiling', U.inr(c.budget)), ui.statline('Type', c.type), ui.statline('Channels', c.channels.map(function (ch) { return store.source(ch).label; }).join(', ')), ui.statline('Center / Dept', (store.center(c.centerId) || {}).short + ' · ' + (store.dept(c.deptId) || {}).name)]);
      var bud = s.budgets.find(function (x) { return x.id === a.entityId; });
      if (bud) return el('div', {}, [el('div.t-up.mb-4', { text: 'Budget increase request' }), ui.statline('Service', bud.service), ui.statline('Center', (store.center(bud.centerId) || {}).short), ui.statline('Spent / Cap', U.inr(bud.spent) + ' / ' + U.inr(bud.cap))]);
    }
    if (a.entity === 'merge') {
      var m = s.merges.find(function (x) { return x.id === a.entityId; });
      if (m) return el('div', {}, [el('div.t-up.mb-4', { text: 'Merge — ' + m.confidence + '% match' })].concat(m.records.map(function (r) { return el('div.t-sm', { style: { padding: '4px 0' } }, '• ' + r.name + ' · ' + r.mobile + ' · ' + store.source(r.source).label); })));
    }
    if (a.entity === 'import') {
      var im = s.imports.find(function (x) { return x.id === a.entityId; });
      if (im) return el('div', {}, [el('div.t-up.mb-4', { text: 'Import batch' }), ui.statline('File', im.fileName), ui.statline('Valid / Total', im.valid + ' / ' + im.total), ui.statline('DQ score', im.dqScore + '/100')]);
    }
    if (a.entity === 'wa_template') {
      var wt = s.waTemplates.find(function (x) { return x.id === a.entityId; });
      if (wt) return el('div', {}, [el('div.t-up.mb-4', { text: 'WhatsApp template — ' + wt.name }), el('div', { style: { background: '#e7f7ed', borderLeft: '3px solid var(--green-500)', padding: '10px', borderRadius: '8px', fontSize: '12.5px' } }, wt.body)]);
    }
    return ui.note('info', a.context, '📄');
  }

  function openReview(a) {
    var noteRef = { v: '' };
    ui.drawer({
      title: a.title, subtitle: a.type + ' · needs ' + store.roleLabel(a.approverRole), wide: true,
      body: [
        el('div.row.gap-6.mb-12', {}, [ui.badge(a.priority, a.priority === 'High' ? 'red' : 'amber'), ui.idChip(a.entityId), ui.slaBadge('approval', a)]),
        el('div.card.card-pad.mb-12', { style: { background: 'var(--surface-2)' } }, [el('div.t-up.mb-8', { text: '🔎 Artifact under review' }), artifact(a)]),
        ui.note('info', '<b>Context (AI-prepared):</b> ' + a.context, '📄'),
        el('div.mt-12', {}, [ui.statline('Requested by', (store.user(a.requestedBy) || {}).name), ui.statline('Created', U.fmtDateTime(a.createdAt)), ui.statline('SLA due', U.fmtDateTime(a.slaDue))]),
        el('div.field.mt-12', {}, [el('label', { text: 'Decision / change note' }), (function () { var t = el('textarea.textarea', { placeholder: 'Reason, conditions, or the change to apply on "approve with changes"…' }); t.addEventListener('input', function () { noteRef.v = t.value; }); return t; })()]),
        el('div.mt-16', {}, [el('div.t-up.mb-8', { text: '💬 Discussion' }), ui.commentThread('approval', a.id)])
      ],
      footer: [
        el('button.btn.btn-success', { onclick: function () { decide(a, 'approved', noteRef.v); closeDrawer(); } }, '✓ Approve'),
        el('button.btn', { onclick: function () { store.actions.approveWithChanges(a.id, noteRef.v); closeDrawer(); ui.toast({ kind: 'success', msg: 'Approved with changes — logged.' }); } }, '✎ Approve w/ changes'),
        el('button.btn', { onclick: function () { store.actions.requestInfo(a.id, noteRef.v); closeDrawer(); ui.toast({ kind: 'info', msg: 'Info requested from ' + (store.user(a.requestedBy) || {}).name }); } }, '↩ Request info'),
        el('button.btn.btn-danger', { onclick: function () { decide(a, 'rejected', noteRef.v); closeDrawer(); } }, '✕ Reject')
      ]
    });
  }
  function closeDrawer() { var r = U.$('#drawer-region'); r.classList.remove('show'); U.clear(r); }
  function decide(a, decision, note) { store.actions.decideApproval(a.id, decision, note); ui.toast({ kind: decision === 'approved' ? 'success' : 'warn', title: decision === 'approved' ? 'Approved' : 'Rejected', msg: a.title + ' — logged with your name & role.' }); }
  function bulkApprove() {
    var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
    ids.forEach(function (id) { store.actions.decideApproval(id, 'approved', '[bulk approved]'); });
    selected = {}; ui.toast({ kind: 'success', msg: ids.length + ' low-risk items approved.' });
  }
  function openDelegate() {
    var s = store.get(); var sel = '';
    var approvers = s.users.filter(function (u) { return ['leadership', 'donor_approver', 'finance_reviewer', 'content_reviewer', 'workflow_manager', 'data_custodian'].indexOf(u.role) > -1; });
    ui.modal({ title: 'Delegate approvals (out-of-office)', subtitle: 'Re-route your pending & incoming approvals to a backup',
      body: el('div', {}, [
        ui.note('amber', 'Prevents a single-person bottleneck — the briefs require a backup approver + SLA. Delegation is logged.', '🤝'),
        el('div.field.mt-12', {}, [el('label', { text: 'Delegate to' }), el('select.select', { onchange: function (e) { sel = e.target.value; } }, [el('option', { value: '', text: 'Select backup approver…' })].concat(approvers.map(function (u) { return el('option', { value: u.id, text: u.name + ' · ' + store.roleLabel(u.role) }); })))])
      ]),
      actions: [{ label: 'Cancel' }, { label: 'Delegate', variant: 'primary', onClick: function () { if (sel) { store.actions.delegateApprovals(sel); ui.toast({ kind: 'success', msg: 'Approvals delegated to ' + (store.user(sel) || {}).name }); } } }] });
  }

  return { render: render, title: 'Approvals' };
})();
