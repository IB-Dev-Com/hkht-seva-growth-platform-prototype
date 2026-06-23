/* ============================================================
   Screen: WF-002 Voice Script Approval Lifecycle
   ============================================================ */
App.screens['wf002-scripts'] = (function () {
  var U = App.util, el = U.el, ui = App.ui, store = App.store;

  var LIFECYCLE = ['Brief', 'AI + writer draft', 'Reviewer', 'Approver', 'Test call (QA)', 'Production'];

  function render() {
    var s = store.get();
    var scripts = s.scripts;

    return el('div', {}, [
      ui.pageHead('Voice Script Approval', 'Every production script passes a controlled lifecycle. Sensitive categories (donor, financial, devotional) need the right approver. <b>AI drafts; humans approve.</b>', null),
      ui.card({ title: 'Approval lifecycle', icon: '🔄', cls: 'mb-16', body: [
        el('div.steps', {}, LIFECYCLE.map(function (st, i) {
          return el('div.step.done', {}, [el('div.sc', { text: i + 1 }), el('span.sl', { text: st }), i < LIFECYCLE.length - 1 ? el('span.line') : null]);
        }))
      ] }),
      el('div.col.gap-12', {}, scripts.map(scriptCard))
    ]);
  }

  function stageIndex(status) { return status === 'production' ? 5 : status === 'review' ? 2 : status === 'draft' ? 1 : 0; }

  function scriptCard(sc) {
    var stage = stageIndex(sc.status);
    return ui.card({ body: [
      el('div.row-between', { style: { flexWrap: 'wrap', gap: '8px' } }, [
        el('div', {}, [
          el('div.row.gap-8', {}, [el('b', { text: sc.name }), ui.idChip(sc.id), ui.badge(sc.version, 'neutral')]),
          el('div.t-xs.t-mut.mt-4', { text: sc.category + ' · ' + sc.language + (sc.campaignId ? ' · ' + sc.campaignId : '') })
        ]),
        el('div.row.gap-8', {}, [sc.qa != null ? ui.badge('QA ' + sc.qa, sc.qa >= 90 ? 'green' : 'amber') : null, ui.statusBadge(sc.status)].filter(Boolean))
      ]),
      el('div.steps.mt-12', {}, ['Brief', 'Draft', 'Review', 'Approve', 'QA', 'Live'].map(function (st, i) {
        return el('div.step' + (i < stage ? '.done' : i === stage ? '.active' : ''), {}, [el('div.sc', { text: i <= stage ? '✓' : i + 1 }), el('span.sl', { text: st }), i < 5 ? el('span.line') : null]);
      })),
      el('div', { style: { background: 'var(--surface-2)', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '12.5px', fontStyle: 'italic', color: 'var(--text-2)' } }, '“' + sc.opening + '”'),
      el('div.row.gap-6.mt-8', { style: { flexWrap: 'wrap' } }, sc.outcomeCodes.map(function (o) { return ui.badge(o, 'neutral'); })),
      el('div.row.gap-8.mt-12', { style: { alignItems: 'center' } }, [
        el('span.t-xs.t-mut', { text: sc.approvalDate ? '✓ Approved by ' + (store.user(sc.approverId) || {}).name + ' · ' + U.fmtDate(sc.approvalDate) : 'Approver: ' + (store.user(sc.approverId) || {}).name + ' (pending)' }),
        el('div.grow'),
        sc.status === 'review' ? el('button.btn.btn-sm.btn-success', { onclick: function () { approve(sc); } }, '✓ Approve for production') : null,
        sc.status === 'draft' ? el('button.btn.btn-sm', { onclick: function () { ui.toast('Sent to reviewer'); sc.status = 'review'; store.commit(); } }, 'Send to review') : null,
        sc.status === 'production' ? el('button.btn.btn-sm.btn-ghost', { onclick: function () { ui.toast('▶ QA test call (simulated)'); } }, '▶ Test call') : null
      ])
    ] });
  }

  function approve(sc) {
    ui.confirm({ title: 'Approve script for production?', message: '<b>' + sc.name + '</b> (' + sc.category + ') will go live for calling. This decision is logged with your name and role.', confirmLabel: 'Approve', variant: 'success', onConfirm: function () {
      sc.status = 'production'; sc.approvalDate = U.now().toISOString(); sc.qa = sc.qa || 90; store.commit();
      var appr = store.get().approvals.find(function (a) { return a.entityId === sc.id && a.status === 'pending'; });
      if (appr) store.actions.decideApproval(appr.id, 'approved', 'Approved from scripts screen');
      ui.toast({ kind: 'success', msg: 'Script approved for production.' });
    } });
  }

  return { render: render, title: 'Voice Scripts' };
})();
