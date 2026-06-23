/* ============================================================
   Screen: Approvals — unified human-in-the-loop queue
   ============================================================ */
App.screens['approvals'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;
  var view = 'pending';

  function render(params, query) {
    var s = store.get();
    var all = U.sortBy(s.approvals, function (a) { return new Date(a.createdAt).getTime(); }, 'desc');
    var pending = all.filter(function (a) { return a.status === 'pending'; });
    var shown = view === 'pending' ? pending : view === 'decided' ? all.filter(function (a) { return a.status !== 'pending'; }) : all;

    // focus from query
    setTimeout(function () { if (query && query.focus) { var a = s.approvals.find(function (x) { return x.id === query.focus; }); if (a && a.status === 'pending') openReview(a); } }, 50);

    return el('div', {}, [
      ui.pageHead('Approvals', 'The platform-wide human-in-the-loop queue. AI prepares decision-quality context; <b>a human decides</b>. Every action is logged with approver, role and timestamp.', [
        ui.badge(pending.length + ' pending', 'amber')
      ]),
      el('div.grid.cols-4.mb-16', {}, [
        ui.kpi({ icon: '⏳', label: 'Pending', value: pending.length, accent: 'amber' }),
        ui.kpi({ icon: '🔴', label: 'SLA breached', value: pending.filter(function (a) { return new Date(a.slaDue) < U.now(); }).length, accent: 'red' }),
        ui.kpi({ icon: '🔼', label: 'High priority', value: pending.filter(function (a) { return a.priority === 'High'; }).length, accent: 'indigo' }),
        ui.kpi({ icon: '✓', label: 'Decided', value: all.filter(function (a) { return a.status !== 'pending'; }).length, accent: 'green' })
      ]),
      el('div.chips.mb-12', {}, [chip('pending', 'Pending', pending.length), chip('decided', 'Decided'), chip('all', 'All')]),
      el('div.col.gap-10', {}, shown.length ? shown.map(card) : [ui.card({ body: [ui.emptyState({ icon: '✅', title: 'Nothing here', sub: 'No items in this view.' })] })])
    ]);
  }

  function chip(v, label, count) { return el('div.fchip' + (view === v ? '.active' : ''), { onclick: function () { view = v; store.emit(); } }, label + (count != null ? ' · ' + count : '')); }

  function card(a) {
    var overdue = a.status === 'pending' && new Date(a.slaDue) < U.now();
    return ui.card({ cls: 'card-hover', body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px', cursor: a.status === 'pending' ? 'pointer' : 'default' }, onclick: a.status === 'pending' ? function () { openReview(a); } : null }, [
        el('div', { style: { flex: 1, minWidth: 0 } }, [
          el('div.row.gap-6', { style: { flexWrap: 'wrap' } }, [ui.badge(a.type, 'indigo'), a.priority === 'High' ? ui.badge('High', 'red') : null, overdue ? ui.badge('SLA breached', 'red', true) : null, ui.idChip(a.entityId)].filter(Boolean)),
          el('div.t-semi.mt-4', { text: a.title }),
          el('div.t-xs.t-mut.mt-2', { text: 'Requested by ' + (store.user(a.requestedBy) || {}).name + ' · ' + U.ago(a.createdAt) + ' · needs ' + store.roleLabel(a.approverRole) })
        ]),
        a.status === 'pending' ? el('div.row.gap-6', {}, [
          el('button.btn.btn-sm.btn-success', { onclick: function (e) { e.stopPropagation(); decide(a, 'approved'); } }, '✓ Approve'),
          el('button.btn.btn-sm.btn-danger', { onclick: function (e) { e.stopPropagation(); decide(a, 'rejected'); } }, '✕ Reject')
        ]) : el('div.col', { style: { alignItems: 'flex-end' } }, [ui.statusBadge(a.status), el('div.t-xs.t-mut3.mt-4', { text: 'by ' + (store.user(a.decisionBy) || {}).name })])
      ])
    ] });
  }

  function openReview(a) {
    ui.drawer({
      title: a.title, subtitle: a.type + ' · ' + store.roleLabel(a.approverRole),
      body: [
        el('div.row.gap-6.mb-12', {}, [ui.badge(a.priority, a.priority === 'High' ? 'red' : 'amber'), ui.idChip(a.entityId), ui.badge('SLA ' + U.ago(a.slaDue), new Date(a.slaDue) < U.now() ? 'red' : 'neutral')]),
        ui.note('info', '<b>Context (AI-prepared):</b> ' + a.context, '📄'),
        el('div.mt-12', {}, [
          ui.statline('Requested by', (store.user(a.requestedBy) || {}).name),
          ui.statline('Approver role', store.roleLabel(a.approverRole)),
          ui.statline('Created', U.fmtDateTime(a.createdAt)),
          ui.statline('SLA due', U.fmtDateTime(a.slaDue))
        ]),
        el('div.field.mt-12', {}, [el('label', { text: 'Decision note (optional)' }), el('textarea.textarea#appr-note', { placeholder: 'Reason / conditions…' })])
      ],
      footer: [
        el('button.btn.btn-success.grow', { onclick: function () { decide(a, 'approved', noteVal()); closeDrawer(); } }, '✓ Approve'),
        el('button.btn.btn-danger.grow', { onclick: function () { decide(a, 'rejected', noteVal()); closeDrawer(); } }, '✕ Reject')
      ]
    });
  }
  function noteVal() { var n = U.$('#appr-note'); return n ? n.value : ''; }
  function closeDrawer() { var r = U.$('#drawer-region'); r.classList.remove('show'); U.clear(r); }

  function decide(a, decision, note) {
    store.actions.decideApproval(a.id, decision, note);
    ui.toast({ kind: decision === 'approved' ? 'success' : 'warn', title: decision === 'approved' ? 'Approved' : 'Rejected', msg: a.title + ' — logged with your name & role.' });
  }

  return { render: render, title: 'Approvals' };
})();
